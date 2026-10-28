class TextureLoader {
  static load(gl, url, style = 'metal') {
    const texture = gl.createTexture();
    // Respaldo procedural: también permite abrir index.html directamente.
    const surface = document.createElement('canvas'); surface.width = surface.height = 128;
    const ctx = surface.getContext('2d');
    ctx.fillStyle = style === 'banda' ? '#343e48' : '#b7bdc5'; ctx.fillRect(0,0,128,128);
    ctx.strokeStyle = style === 'piso' ? '#87939f' : '#737e89';
    ctx.lineWidth = style === 'piso' ? 2 : 1;
    const step = style === 'piso' ? 32 : style === 'banda' ? 16 : 4;
    for (let i=0; i<=128; i+=step) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(128,i); ctx.stroke();
      if (style === 'piso') { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,128); ctx.stroke(); } }
    const upload = image => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    };
    upload(surface);
    if (location.protocol !== 'file:') {
      const image = new Image(); image.onload = () => upload(image);
      image.onerror = () => console.warn('Se utiliza la textura procedural para ' + url);
      image.src = url;
    }
    return texture;
  }
}
