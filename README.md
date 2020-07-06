# webgl-learn

## 1. 工作原理

WebGL在电脑的GPU中运行。因此你需要使用能够在GPU上运行的代码。 这样的代码需要提供成对的方法。每对方法中一个叫顶点着色器， 另一个叫片断着色器，并且使用一种和C或C++类似的强类型的语言 GLSL。 (GL着色语言)。 每一对组合起来称作一个 program（着色程序）。  

顶点着色器的作用是计算顶点的位置。根据计算出的一系列顶点位置，WebGL可以对点， 线和三角形在内的一些图元进行光栅化处理。当对这些图元进行光栅化处理时需要使用片断着色器方法。 片断着色器的作用是计算出当前绘制图元中每个像素的颜色值。  

WebGL在GPU上的工作基本上分为两部分，第一部分是将顶点（或数据流）转换到裁剪空间坐标， 第二部分是基于第一部分的结果绘制像素点。

```js
var primitiveType = gl.TRIANGLES;
var offset = 0;
var count = 9;
gl.drawArrays(primitiveType, offset, count);
```

9表示“处理9个顶点”，所以将会有9个顶点被转换。  

![工作原理](images/vertex-shader-anim.gif)

顶点着色器（Vertex Shader）是你写进GLSL 中的一个方法，每个顶点调用一次，在这个方法中做一些数学运算后设置了一个特殊的gl_Position变量， 这个变量就是该顶点转换到裁剪空间中的坐标值，GPU接收该值并将其保存起来。  

WebGL绘制过程包括以下三步：  
1. 获取顶点坐标  
2. 图元装配（即画出一个个三角形）  
3. 光栅化（生成片元，即一个个像素点）  

![WebGL绘制流程](images/webgl-1.png)

## 2. 基本概念

1. gl.createShader——创建着色器对象  

```js
 const vertexShader = gl.createShader(gl.VERTEX_SHADER);
```

2. gl.shaderSource——设置 WebGLShader 着色器（顶点着色器及片元着色器）的GLSL程序代码  

```js
 const vertex = `
      attribute vec2 position;
      varying vec3 color;

      void main() {
        gl_PointSize = 1.0;
        color = vec3(0.5 + position * 0.5, 0.0);
        gl_Position = vec4(position * 0.5, 1.0, 1.0);
      }
    `;

    const fragment = `
      precision mediump float;
      varying vec3 color;

      void main()
      {
        gl_FragColor = vec4(color, 1.0);
      }    
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertex);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragment);
     gl.compileShader(fragmentShader);
```

3. gl.compileShader——编译一个GLSL着色器，使其成为为二进制数据，然后就可以被WebGLProgram对象所使用.  

代码块见上  

4. gl.createProgram——创建和初始化一个 WebGLProgram 对象。  

```js
const program = gl.createProgram();
```

5. gl.attachShader——往 WebGLProgram 添加一个片段或者顶点着色器。  

```js
gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
```

6. gl.linkProgram——链接给定的WebGLProgram，从而完成为程序的片元和顶点着色器准备GPU代码的过程。  

```js
gl.linkProgram(program);
```

7. gl.useProgram——将定义好的WebGLProgram 对象添加到当前的渲染状态中。  

```js
gl.useProgram(program);
```

8. gl.createBuffer——创建并初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象
8. gl.createBuffer——创建并初始化一个用于储存顶点数据或着色数据的WebGLBuffer对象

```js
 const bufferId = gl.createBuffer();
 const bufferId = gl.createBuffer();
```

9. gl.bindBuffer——设置缓冲为当前使用缓冲  

```js
 gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
```

10. gl.bufferData——将数据拷贝到缓冲  

```js
 const points = new Float32Array([
      -1, -1,
      0, 1,
      1, -1,
    ]);
 gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
```

11. gl.getAttribLocation——返回了给定WebGLProgram对象中某属性的下标指向位置。  

```js
 const vPosition = gl.getAttribLocation(program, 'position');
 gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
 gl.enableVertexAttribArray(vPosition);
```

12. gl.vertexAttribPointer——诉显卡从当前绑定的缓冲区（bindBuffer()指定的缓冲区）中读取顶点数据  

```js
gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
// index 指定要修改的顶点属性的索引。

// size 指定每个顶点属性的组成数量，必须是1，2，3或4...

// type指定数组中每个元素的数据类型可能是：
// gl.BYTE: signed 8-bit integer, with values in [-128, 127] 有符号的8位整数，范围[-128, 127]
// gl.SHORT: signed 16-bit integer, with values in [-32768, 32767] 有符号的16位整数，范围[-32768, 32767]
// gl.UNSIGNED_BYTE: unsigned 8-bit integer, with values in [0, 255] 无符号的8位整数，范围[0, 255]
// gl.UNSIGNED_SHORT: unsigned 16-bit integer, with values in [0, 65535] 无符号的16位整数，范围[0, 65535]
// gl.FLOAT: 32-bit IEEE floating point number 32位IEEE标准的浮点数
// 使用WebGL2版本的还可以使用以下值gl.HALF_FLOAT: 16-bit IEEE floating point number 16位IEEE标准的浮点数

// normalized 当转换为浮点数时是否应该将整数数值归一化到特定的范围。
// 对于类型gl.BYTE和gl.SHORT，如果是true则将值归一化为[-1, 1]
// 对于类型gl.UNSIGNED_BYTE和gl.UNSIGNED_SHORT，如果是true则将值归一化为[0, 1]
// 对于类型gl.FLOAT和gl.HALF_FLOAT，此参数无效

// stride  一个GLsizei，以字节为单位指定连续顶点属性开始之间的偏移量(即数组中一行长度)。不能大于255。如果stride为0，则假定该属性是紧密打包的，即不交错属性，每个属性在一个单独的块中，下一个顶点的属性紧跟当前顶点之后。

// offset GLintptr指定顶点属性数组中第一部分的字节偏移量。必须是类型的字节长度的倍数。

```

13. gl.enableVertexAttribArray——可以打开属性数组列表中指定索引处的通用顶点属性数组。通过disableVertexAttribArray()方法关闭顶点属性数组.  

代码块见上  

14. gl.clear——把指定的缓冲区清空为预设的值。  

```js
gl.clear(gl.COLOR_BUFFER_BIT);
```

15. gl.drawArrays——渲染数组中的原始数据。  

```js
gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
```

