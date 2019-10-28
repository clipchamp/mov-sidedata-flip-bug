function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function setupDraw(gl, width, height) {
  const program = webglUtils.createProgramFromScripts(gl, [
    "2d-vertex-shader",
    "2d-fragment-shader"
  ]);

  // look up where the vertex data needs to go.
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  const positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Set a rectangle the same size as the image.
  setRectangle(gl, 0, 0, width, height);

  // provide texture coordinates for the rectangle.
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      1.0,
      0.0,
      1.0,
      1.0,
      0.0,
      1.0,
      1.0
    ]),
    gl.STATIC_DRAW
  );

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 2; // 2 components per iteration
  let type = gl.FLOAT; // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // Turn on the teccord attribute
  gl.enableVertexAttribArray(texcoordLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  size = 2; // 2 components per iteration
  type = gl.FLOAT; // the data is 32bit floats
  normalize = false; // don't normalize the data
  stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  offset = 0; // start at the beginning of the buffer

  gl.vertexAttribPointer(
    texcoordLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // Draw the rectangle.
  const primitiveType = gl.TRIANGLES;
  offset = 0;
  const count = 6;

  return pixelData => {
    // Create a texture.
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixelData
    );

    // lookup uniforms
    let resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    let textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    // set the size of the image
    gl.uniform2f(textureSizeLocation, width, height);

    // Upload the image into the texture.
    gl.drawArrays(primitiveType, offset, count);
    gl.deleteTexture(texture);
  };
}

function setRectangle(gl, x, y, width, height) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

window.addEventListener("load", () => {
  const videoElement = { current: undefined };

  const fileInput = document.getElementById("file");

  // Create blob url and start playing video when
  // file has been added
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.addEventListener("load", () => {
      const video = document.createElement("video");
      const source = document.createElement("source");
      source.src = reader.result;
      source.setAttribute("type", "video/mp4");
      video.setAttribute("controls", true);
      video.appendChild(source);
      video.play().catch(() => {});
      videoElement.current = video;
      document.body.appendChild(video);
      fileInput.remove();
    });

    reader.readAsDataURL(file);
  });

  const mainCanvas = createCanvas(1920, 1080);
  document.body.appendChild(mainCanvas);
  const gl = mainCanvas.getContext("webgl");

  const { width, height } = mainCanvas.getBoundingClientRect();

  const draw = setupDraw(gl, width, height);

  const loop = () => {
    // If the video element has loaded, upload it to the canvas
    if (videoElement.current) {
      draw(videoElement.current);
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
});
