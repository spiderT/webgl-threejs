# webgl-learn

分为webgl 和 three.js 两部分学习  

参考资料：  
[webgl教程](https://webglfundamentals.org/webgl/lessons/zh_cn/)  
[Three.js教程](http://www.webgl3d.cn/Three.js/)  

## webgl

### 1. 工作原理

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

### 2. 基础概念

WebGL每次绘制需要两个着色器， 一个顶点着色器和一个片断着色器，每一个着色器都是一个方法。 一个顶点着色器和一个片断着色器链接在一起放入一个着色程序中（或者只叫程序）。 一个典型的WebGL应用会有多个着色程序。

#### 2.1. 顶点着色器

一个顶点着色器的工作是生成裁剪空间坐标值

```js
void main() {
   gl_Position = doMathToMakeClipspaceCoordinates
}
```

每个顶点调用一次（顶点）着色器，每次调用都需要设置一个特殊的全局变量gl_Position， 该变量的值就是裁减空间坐标值。  

顶点着色器需要的数据，可以通过以下三种方式获得。  

1. Attributes 属性 (从缓冲中获取的数据)  
2. Uniforms 全局变量 (在一次绘制中对所有顶点保持一致值)  
3. Textures 纹理 (从像素或纹理元素中获取的数据)  

##### 2.1.1. Attributes 属性

创建缓冲

```js
var buf = gl.createBuffer();
```

将数据存入缓冲

```js
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(gl.ARRAY_BUFFER, someData, gl.STATIC_DRAW);
```

初始化的时候，在制作的（着色）程序中找到属性所在地址

```js
var positionLoc = gl.getAttribLocation(someShaderProgram, "a_position");
```

在渲染的时候告诉WebGL怎么从缓冲中获取数据传递给属性

```js
// 开启从缓冲中获取数据
gl.enableVertexAttribArray(positionLoc);
 
var numComponents = 3;  // (x, y, z)
var type = gl.FLOAT;    // 32位浮点数据
var normalize = false;  // 不标准化
var offset = 0;         // 从缓冲起始位置开始获取
var stride = 0;         // 到下一个数据跳多少位内存
                        // 0 = 使用当前的单位个数和单位长度 （ 3 * Float32Array.BYTES_PER_ELEMENT ）

// 绑定当前缓冲区范围到gl.ARRAY_BUFFER,成为当前顶点缓冲区对象的通用顶点属性并指定它的布局(缓冲区对象中的偏移量)。
gl.vertexAttribPointer(positionLoc, numComponents, type, false, stride, offset);
```

不做任何运算直接将数据传递给gl_Position。

```js
attribute vec4 a_position;
 
void main() {
   gl_Position = a_position;
}
```

如果缓冲中存的是裁剪空间坐标就没什么问题。  

属性可以用 float, vec2, vec3, vec4, mat2, mat3 和 mat4 数据类型。  

向量：  
vec   {2,3,4}     长度为2, 3, 4的float向量  
bvec {2,3,4}     长度为2, 3, 4的bool向量  
ivec  {2,3,4}     长度为2, 3, 4的int向量  
矩阵：  
mat2   2*2的浮点矩阵  
mat3   3*3的浮点矩阵  
mat4   4*4的浮点矩阵  

##### 2.1.2. Uniforms 全局变量

全局变量在一次绘制过程中传递给着色器的值都一样，在下面的一个简单的例子中， 用全局变量给顶点着色器添加了一个偏移量

```js
attribute vec4 a_position;
uniform vec4 u_offset;
 
void main() {
   gl_Position = a_position + u_offset;
}
```

把所有顶点偏移一个固定值，首先在初始化时找到全局变量的地址

```js
var offsetLoc = gl.getUniformLocation(someProgram, "u_offset");
```

然后在绘制前设置全局变量

```js
gl.uniform4fv(offsetLoc, [1, 0, 0, 0]);  // 向右偏移一半屏幕宽度
```

> 要注意的是全局变量属于单个着色程序，如果多个着色程序有同名全局变量，需要找到每个全局变量并设置自己的值。   

全局变量有很多类型，对应的类型有对应的设置方法。  

```js
gl.uniform1f (floatUniformLoc, v);                 // float
gl.uniform1fv(floatUniformLoc, [v]);               // float 或 float array
gl.uniform2f (vec2UniformLoc,  v0, v1);            // vec2
gl.uniform2fv(vec2UniformLoc,  [v0, v1]);          // vec2 或 vec2 array
gl.uniform3f (vec3UniformLoc,  v0, v1, v2);        // vec3
gl.uniform3fv(vec3UniformLoc,  [v0, v1, v2]);      // vec3 或 vec3 array
gl.uniform4f (vec4UniformLoc,  v0, v1, v2, v4);    // vec4
gl.uniform4fv(vec4UniformLoc,  [v0, v1, v2, v4]);  // vec4 或 vec4 array

gl.uniformMatrix2fv(mat2UniformLoc, false, [  4x element array ])  // mat2 或 mat2 array
gl.uniformMatrix3fv(mat3UniformLoc, false, [  9x element array ])  // mat3 或 mat3 array
gl.uniformMatrix4fv(mat4UniformLoc, false, [ 16x element array ])  // mat4 或 mat4 array

gl.uniform1i (intUniformLoc,   v);                 // int
gl.uniform1iv(intUniformLoc, [v]);                 // int 或 int array
gl.uniform2i (ivec2UniformLoc, v0, v1);            // ivec2
gl.uniform2iv(ivec2UniformLoc, [v0, v1]);          // ivec2 或 ivec2 array
gl.uniform3i (ivec3UniformLoc, v0, v1, v2);        // ivec3
gl.uniform3iv(ivec3UniformLoc, [v0, v1, v2]);      // ivec3 or ivec3 array
gl.uniform4i (ivec4UniformLoc, v0, v1, v2, v4);    // ivec4
gl.uniform4iv(ivec4UniformLoc, [v0, v1, v2, v4]);  // ivec4 或 ivec4 array

gl.uniform1i (sampler2DUniformLoc,   v);           // sampler2D (textures)
gl.uniform1iv(sampler2DUniformLoc, [v]);           // sampler2D 或 sampler2D array

gl.uniform1i (samplerCubeUniformLoc,   v);         // samplerCube (textures)
gl.uniform1iv(samplerCubeUniformLoc, [v]);         // samplerCube 或 samplerCube array
```

一个数组可以一次设置所有的全局变量，例如

```js
// 着色器里
uniform vec2 u_someVec2[3];

// JavaScript 初始化时
var someVec2Loc = gl.getUniformLocation(someProgram, "u_someVec2");

// 渲染的时候
gl.uniform2fv(someVec2Loc, [1, 2, 3, 4, 5, 6]);  // 设置数组 u_someVec2
```

想单独设置数组中的某个值，就要单独找到该值的地址。

```js
// JavaScript 初始化时
var someVec2Element0Loc = gl.getUniformLocation(someProgram, "u_someVec2[0]");
var someVec2Element1Loc = gl.getUniformLocation(someProgram, "u_someVec2[1]");
var someVec2Element2Loc = gl.getUniformLocation(someProgram, "u_someVec2[2]");

// 渲染的时候
gl.uniform2fv(someVec2Element0Loc, [1, 2]);  // set element 0
gl.uniform2fv(someVec2Element1Loc, [3, 4]);  // set element 1
gl.uniform2fv(someVec2Element2Loc, [5, 6]);  // set element 2
```

如果创建了一个结构体, 需要找到每个元素的地址

```js
struct SomeStruct {
  bool active;
  vec2 someVec2;
};
uniform SomeStruct u_someThing;

var someThingActiveLoc = gl.getUniformLocation(someProgram, "u_someThing.active");
var someThingSomeVec2Loc = gl.getUniformLocation(someProgram, "u_someThing.someVec2");
```

#### 2.2. 片断着色器

一个片断着色器的工作是为当前光栅化的像素提供颜色值，通常是以下的形式

```js
precision mediump float;

void main() {
   gl_FragColor = doMathToMakeAColor;
}
```

每个像素都将调用一次片断着色器，每次调用需要从你设置的特殊全局变量gl_FragColor中获取颜色信息。  

片断着色器所需的数据，可以通过以下三种方式获取  

Uniforms 全局变量  
Textures 纹理  
Varyings 可变量  

##### 2.2.1. Uniform 全局变量（片断着色器中）

同 Uniforms 全局变量.

##### 2.2.2. Textures 纹理（片断着色器中）

在着色器中获取纹理信息，可以先创建一个sampler2D类型全局变量，然后用GLSL方法texture2D 从纹理中提取信息。

```js
precision mediump float;

uniform sampler2D u_texture;

void main() {
   vec2 texcoord = vec2(0.5, 0.5)  // 获取纹理中心的值
   gl_FragColor = texture2D(u_texture, texcoord);
}
```

从纹理中获取的数据取决于很多设置。 至少要创建并给纹理填充数据，例如

```js
var tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
var level = 0;
var width = 2;
var height = 1;
var data = new Uint8Array([
   255, 0, 0, 255,   // 一个红色的像素
   0, 255, 0, 255,   // 一个绿色的像素
]);
gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);


// 在初始化时找到全局变量的地址
var someSamplerLoc = gl.getUniformLocation(someProgram, "u_texture");

// 在渲染的时候WebGL要求纹理必须绑定到一个纹理单元上
var unit = 5;  // 挑选一个纹理单元
gl.activeTexture(gl.TEXTURE0 + unit);
gl.bindTexture(gl.TEXTURE_2D, tex);

// 诉着色器你要使用的纹理在那个纹理单元
gl.uniform1i(someSamplerLoc, unit);
```

##### 2.2.3. Varyings 可变量

可变量是一种顶点着色器给片断着色器传值的方式。  

为了使用可变量，要在两个着色器中定义同名的可变量。 给顶点着色器中可变量设置的值，会作为参考值进行内插，在绘制像素时传给片断着色器的可变量。  

```js
attribute vec4 a_position;

uniform vec4 u_offset;

varying vec4 v_positionWithOffset;

void main() {
  gl_Position = a_position + u_offset;
  v_positionWithOffset = a_position + u_offset;
}
```

#### 2.3. GLSL

全称是 Graphics Library Shader Language （图形库着色器语言），是着色器使用的语言.  

目的是为栅格化图形提供常用的计算功能。 所以它内建的数据类型例如vec2, vec3和 vec4分别代表两个值，三个值和四个值， 类似的还有mat2, mat3 和 mat4 分别代表 2x2, 3x3 和 4x4 矩阵。  

```js
// 常量和矢量的乘法。
vec4 a = vec4(1, 2, 3, 4);
vec4 b = a * 2.0;// b 现在是 vec4(2, 4, 6, 8);

// 做矩阵乘法以及矢量和矩阵的乘法
mat4 a = ???
mat4 b = ???
mat4 c = a * b;
 
vec4 v = ???
vec4 y = c * v;
```

为矢量数据提供多种分量选择器，例如 vec4

```js
vec4 v;

// v.x 和 v.s 以及 v.r ， v[0] 表达的是同一个分量。
// v.y 和 v.t 以及 v.g ， v[1] 表达的是同一个分量。
// v.z 和 v.p 以及 v.b ， v[2] 表达的是同一个分量。
// v.w 和 v.q 以及 v.a ， v[3] 表达的是同一个分量。


// 支持矢量调制，意味者你可以交换或重复分量。
// 是一样的
v.yyyy

vec4(v.y, v.y, v.y, v.y)

// 是一样的
vec4 m = mix(v1, v2, f);
vec4 m = vec4(
  mix(v1.x, v2.x, f),
  mix(v1.y, v2.y, f),
  mix(v1.z, v2.z, f),
  mix(v1.w, v2.w, f));
```

### 3. 常用api

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

### 4. 仿射变换

仿射变换简单来说就是“线性变换 + 平移”  

1. 仿射变换前是直线段的，仿射变换后依然是直线段  

2. 对两条直线段 a 和 b 应用同样的仿射变换，变换前后线段长度比例保持不变  

#### 4.1. 向量的平移、旋转与缩放

常见的仿射变换形式包括平移、旋转、缩放以及它们的组合。其中，平移变换是最简单的仿射变换。如果我们想让向量 P(x0, y0) 沿着向量 Q(x1, y1) 平移，只要将 P 和 Q 相加就可以了。  

x=x0+x1  
y=y0+y1  

旋转变换  

```js
class Vector2D {
  ...  
  rotate(rad) {
    const c = Math.cos(rad),
      s = Math.sin(rad);
    const [x, y] = this;

    this.x = x * c + y * -s;
    this.y = x * s + y * c;

    return this;
  }
}
```

![p1](images/p1.jpg)

假设向量 P 的长度为 r，角度是⍺，现在我们要将它顺时针旋转⍬角，此时新的向量 P’的参数方程为：

![p2](images/p2.jpeg)

因为 rcos⍺、rsin⍺是向量 P 原始的坐标 x0、y0，所以，我们可以把坐标代入到上面的公式中，就会得到如下的公式：

![p3](images/p3.jpeg)

我们再将它写成矩阵形式，就会得到一个旋转矩阵。

![p4](images/p4.jpeg)

#### 4.2. 缩放变换

直接让向量与标量（标量只有大小、没有方向）相乘。  

x = sx x0  
y = sy y0  

#### 4.3. 仿射变换的应用：实现粒子动画

在一定时间内生成许多随机运动的小图形，这类动画通常是通过给人以视觉上的震撼，来达到获取用户关注的效果。  

粒子动画的运行效果，是从一个点开始发射出许多颜色、大小、角度各异的三角形，并且通过不断变化它们的位置，产生一种撒花般的视觉效果。  

##### 4.3.1. 创建三角形

定义三角形的顶点并将数据送到缓冲区

```js

const position = new Float32Array([
  -1, -1,
  0, 1,
  1, -1,
]);
const bufferId = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);

const vPosition = gl.getAttribLocation(program, 'position');
gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(vPosition);
```

创建随机三角形属性  

```js

function randomTriangles() {
  const u_color = [Math.random(), Math.random(), Math.random(), 1.0]; // 随机颜色
  const u_rotation = Math.random() * Math.PI; // 初始旋转角度
  const u_scale = Math.random() * 0.05 + 0.03; // 初始大小
  const u_time = 0;
  const u_duration = 3.0; // 持续3秒钟

  const rad = Math.random() * Math.PI * 2;
  const u_dir = [Math.cos(rad), Math.sin(rad)]; // 运动方向
  const startTime = performance.now();

  return {u_color, u_rotation, u_scale, u_time, u_duration, u_dir, startTime};
}

```

##### 4.3.2. 设置 uniform 变量

uniform 声明的变量和其他语言中的常量一样，我们赋给 unform 变量的值在 shader 执行的过程中不可改变。而且一个变量的值是唯一的，不随顶点变化。uniform 变量既可以在顶点着色器中使用，也可以在片元着色器中使用。

```js

function setUniforms(gl, {u_color, u_rotation, u_scale, u_time, u_duration, u_dir}) {
  // gl.getUniformLocation 拿到uniform变量的指针
  let loc = gl.getUniformLocation(program, 'u_color');
  // 将数据传给 unfirom 变量的地址
  gl.uniform4fv(loc, u_color);

  loc = gl.getUniformLocation(program, 'u_rotation');
  gl.uniform1f(loc, u_rotation);

  loc = gl.getUniformLocation(program, 'u_scale');
  gl.uniform1f(loc, u_scale);

  loc = gl.getUniformLocation(program, 'u_time');
  gl.uniform1f(loc, u_time);

  loc = gl.getUniformLocation(program, 'u_duration');
  gl.uniform1f(loc, u_duration);

  loc = gl.getUniformLocation(program, 'u_dir');
  gl.uniform2fv(loc, u_dir);
}
```

顶点着色器中的 glsl 代码

```js

attribute vec2 position;

uniform float u_rotation;
uniform float u_time;
uniform float u_duration;
uniform float u_scale;
uniform vec2 u_dir;

varying float vP;

void main() {
  float p = min(1.0, u_time / u_duration);
  float rad = u_rotation + 3.14 * 10.0 * p;
  float scale = u_scale * p * (2.0 - p);
  vec2 offset = 2.0 * u_dir * p * p;
  mat3 translateMatrix = mat3(
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    offset.x, offset.y, 1.0
  );
  mat3 rotateMatrix = mat3(
    cos(rad), sin(rad), 0.0,
    -sin(rad), cos(rad), 0.0,
    0.0, 0.0, 1.0
  );
  mat3 scaleMatrix = mat3(
    scale, 0.0, 0.0,
    0.0, scale, 0.0,
    0.0, 0.0, 1.0
  );
  gl_PointSize = 1.0;
  vec3 pos = translateMatrix * rotateMatrix * scaleMatrix * vec3(position, 1.0);
  gl_Position = vec4(pos, 1.0);
  vP = p;
}
```

在片元着色器中着色

```js

 precision mediump float;
  uniform vec4 u_color;
  varying float vP;

  void main()
  {
    gl_FragColor.xyz = u_color.xyz;
    gl_FragColor.a = (1.0 - vP) * u_color.a;
  }  
```

##### 4.4.3. 用 requestAnimationFrame 实现动画

```js

let triangles = [];

function update() {
  for(let i = 0; i < 5 * Math.random(); i++) {
    triangles.push(randomTriangles());
  }
  gl.clear(gl.COLOR_BUFFER_BIT);
  // 对每个三角形重新设置u_time
  triangles.forEach((triangle) => {
    triangle.u_time = (performance.now() - triangle.startTime) / 1000;
    setUniforms(gl, triangle);
    gl.drawArrays(gl.TRIANGLES, 0, position.length / 2);
  });
  // 移除已经结束动画的三角形
  triangles = triangles.filter((triangle) => {
    return triangle.u_time <= triangle.u_duration;
  });
  requestAnimationFrame(update);
}

requestAnimationFrame(update);
```

### 5. 绘制重复图案

#### 5.1. 使用 background-image 来绘制重复图案

```css
canvas {
  background-image: linear-gradient(to right, transparent 90%, #ccc 0),
    linear-gradient(to bottom, transparent 90%, #ccc 0);
  background-size: 8px 8px, 8px 8px;
}
```

利用浏览器自己的 background-repeat 机制，就可以实现网格背景。

![网格图](images/p5.jpeg)

#### 5.2. 使用 Shader 来绘制重复图案

利用 GPU 并行计算的特点，使用着色器来绘制背景网格这样的重复图案。

```js

//顶点着色器:

attribute vec2 a_vertexPosition;
attribute vec2 uv;
varying vec2 vUv;


void main() {
  gl_PointSize = 1.0;
  vUv = uv;
  gl_Position = vec4(a_vertexPosition, 1, 1);


//片元着色器:


#ifdef GL_ES
precision mediump float;
#endif
varying vec2 vUv;
uniform float rows;

void main() {
  vec2 st = fract(vUv * rows);
  float d1 = step(st.x, 0.9);
  float d2 = step(0.1, st.y);
  gl_FragColor.rgb = mix(vec3(0.8), vec3(1.0), d1 * d2);
  gl_FragColor.a = 1.0;
}

```

一个基础库gl-renderer。gl-renderer 在 WebGL 底层的基础上进行了一些简单的封装，以便于我们将重点放在提供几何数据、设置变量和编写 Shader 上，不用因为创建 buffer 等细节而分心。  

```js

//第一步: 创建 Renderer 对象
const canvas = document.querySelector('canvas');
const renderer = new GlRenderer(canvas);

//第二步: 创建并启用 WebGL 程序
const program = renderer.compileSync(fragment, vertex);
renderer.useProgram(program);

//第三步: 设置 uniform 变量
renderer.uniforms.rows = 64;

//第四步: 将顶点数据送入缓冲区。

renderer.setMeshData([{
  positions: [
    [-1, -1],
    [-1, 1],
    [1, 1],
    [1, -1],
  ],
  attributes: {
    uv: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  },
  cells: [[0, 1, 2], [2, 0, 3]],
}]);

```

## three.js

Three.js是基于原生WebGL封装运行的三维引擎

### 1. 程序结构

![程序结构](images/threejs1.png)

demo1 创建一个立方体

```js
// 创建场景对象Scene
const scene = new THREE.Scene();

// 创建网格模型
const geometry = new THREE.BoxGeometry(100, 100, 100); //创建一个立方体几何对象Geometry
const material = new THREE.MeshLambertMaterial({
  color: 0x0000ff
});

//材质对象Material
const mesh = new THREE.Mesh(geometry, material); //网格模型对象Mesh
scene.add(mesh); //网格模型添加到场景中

// 光源设置
//点光源
const point = new THREE.PointLight(0xffffff);
point.position.set(400, 200, 300); //点光源位置
scene.add(point); //点光源添加到场景中

//环境光
const ambient = new THREE.AmbientLight(0x444444);
scene.add(ambient);

// 相机设置
const width = window.innerWidth; //窗口宽度
const height = window.innerHeight; //窗口高度
const k = width / height; //窗口宽高比
const s = 200; //三维场景显示范围控制系数，系数越大，显示的范围越大

//创建相机对象
const camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);
camera.position.set(200, 300, 200); //设置相机位置
camera.lookAt(scene.position); //设置相机方向(指向的场景对象)

// 创建渲染器对象
const renderer = new THREE.WebGLRenderer();
renderer.setSize(width, height); //设置渲染区域尺寸
renderer.setClearColor(0xb9d3ff, 1); //设置背景颜色
document.body.appendChild(renderer.domElement); //body元素中插入canvas对象

//执行渲染操作   指定场景、相机作为参数
renderer.render(scene, camera);
```

#### 1.1. 材质Material

代码var material=new THREE.MeshLambertMaterial({color:0x0000ff});通过构造函数THREE.MeshLambertMaterial()创建了一个可以用于立方体的材质对象， 构造函数的参数是一个对象，对象包含了颜色、透明度等属性，本案例中只定义了颜色color，颜色属性值0x0000ff表示蓝色，可以把颜色值改为0x00ff00，可以看到是绿色的立方体效果， 这里使用的颜色值表示方法是16进制RGB三原色模型。 

##### 材质属性

color 材质颜色，比如蓝色0x0000ff  
wireframe 将几何图形渲染为线框。 默认值为false  
opacity 透明度设置，0表示完全透明，1表示完全不透明  
transparent 是否开启透明，默认false  

```js
// 半透明效果
var sphereMaterial=new THREE.MeshLambertMaterial({
    color:0xff0000,
    opacity:0.7,
    transparent:true
});
```

##### 添加高光效果

处在光照条件下的物体表面会发生光的反射现象，不同的表面粗糙度不同，宏观上来看对光的综合反射效果，可以使用两个反射模型来概括，一个是漫反射，一个是镜面反射， 使用渲染软件或绘画的时候都会提到一个高光的概念，其实说的就是物理光学中镜面反射产生的局部高亮效果。  

对于three.js而言漫反射、镜面反射分别对应两个构造函数MeshLambertMaterial()、MeshPhongMaterial(),通过three.js引擎你可以很容易实现这些光照模型，不需要自己再使用原生WebGL实现  

```js
// 添加高光效果
var sphereMaterial=new THREE.MeshPhongMaterial({
    color:0x0000ff,
    specular:0x4488ee,
    shininess:12
});
```

#### 1.2. 光源Light

代码var point=new THREE.PointLight(0xffffff);通过构造函数THREE.PointLight()创建了一个点光源对象，参数0xffffff定义的是光照强度， 你可以尝试把参数更改为为0x444444，刷新浏览器你会看到立方体的表面颜色变暗，这很好理解，实际生活中灯光强度变低了，周围的景物自然暗淡，three.js引擎对WebGL光照模型算法都进行了封装.  

##### 常见光源类型

AmbientLight 环境光  
PointLight 点光源  
DirectionalLight 平行光，比如太阳光  
SpotLight 聚光源  

```js
// 环境光    环境光颜色与网格模型的颜色进行RGB进行乘法运算
var ambient = new THREE.AmbientLight(0x444444);
scene.add(ambient);
```

```js
//点光源
var point = new THREE.PointLight(0xffffff);
point.position.set(400, 200, 300); //点光源位置
// 通过add方法插入场景中，不插入的话，渲染的时候不会获取光源的信息进行光照计算
scene.add(point); //点光源添加到场景中
```

#### 1.3. 相机Camera

代码var camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 1000);通过构造函数THREE.OrthographicCamera()创建了一个正射投影相机对象， 把该构造函数参数中用到的参数s，也就是代码var s = 200;中定义的一个系数，可以把200更改为300,你会发现立方体显示效果变小，这很好理解，相机构造函数的的前四个参数定义的是拍照窗口大小， 就像平时拍照一样，取景范围为大，被拍的人相对背景自然变小了。  
camera.position.set(200, 300, 200);和camera.lookAt(scene.position);定义的是相机的位置和拍照方向，可以更改camera.position.set(200,300,200);参数重新定义的相机位置，把第一个参数也就是x坐标从200更改为250， 你会发现立方的在屏幕上呈现的角度变了，这就像你生活中拍照人是同一个人，但是你拍照的位置角度不同，显示的效果肯定不同。  

#### 1.4. 鼠标操作三维场景

为了使用鼠标操作三维场景，可以借助three.js众多控件之一OrbitControls.js，可以在下载的three.js-master文件中找到(three.js-master\examples\js\controls)。  

OrbitControls.js控件支持鼠标左中右键操作和键盘方向键操作，具体代码如下，使用下面的代码替换前面demo中renderer.render(scene,camera)即可。  

```js
function render() {
  renderer.render(scene,camera);//执行渲染操作
}
render();
var controls = new THREE.OrbitControls(camera,renderer.domElement);//创建控件对象
controls.addEventListener('change', render);//监听鼠标、键盘事件
```

OrbitControls.js控件提供了一个构造函数THREE.OrbitControls()，把一个相机对象作为参数的时候，执行代码new THREE.OrbitControls(camera,renderer.domElement)，浏览器会自动检测鼠标键盘的变化， 并根据鼠标和键盘的变化更新相机对象的参数，比如你拖动鼠标左键，浏览器会检测到鼠标事件，把鼠标平移的距离按照一定算法转化为相机的的旋转角度，你可以联系生活中相机拍照,即使景物没有变化，你的相机拍摄角度发生了变化，自然渲染器渲染出的结果就变化了，通过定义监听事件controls.addEventListener('change', render)，如果你连续操作鼠标，相机的参数不停的变化，同时会不停的调用渲染函数render()进行渲染，这样threejs就会使用相机新的位置或角度数据进行渲染。  

### 2. 几何体顶点

几何体API  

访问几何体顶点位置数据  BufferGeometry.attributes.position  
访问几何体顶点颜色数据  BufferGeometry.attributes.color  
访问几何体顶点法向量数据  BufferGeometry.attributes.normal  

#### 2.1. 顶点位置数据解析渲染

通过Threejs引擎的BufferGeometry和BufferAttribute两个API自定义了一个具有六个顶点数据的几何体。  

```js
var geometry = new THREE.BufferGeometry(); //创建一个Buffer类型几何体对象
//类型数组创建顶点数据
var vertices = new Float32Array([
  0, 0, 0, //顶点1坐标
  50, 0, 0, //顶点2坐标
  0, 100, 0, //顶点3坐标
  0, 0, 10, //顶点4坐标
  0, 0, 100, //顶点5坐标
  50, 0, 10, //顶点6坐标
]);
// 创建属性缓冲区对象
var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，表示一个顶点的xyz坐标
// 设置几何体attributes属性的位置属性
geometry.attributes.position = attribue;
```

##### 点模型Points

可以把几何体geometry作为点模型Points而不是网格模型Mesh的参数，你会发现上面的六个点坐标会渲染为六个方形的点区域.

```js
// 点渲染模式
var material = new THREE.PointsMaterial({
  color: 0xff0000,
  size: 10.0 //点对象像素尺寸
}); //材质对象
var points = new THREE.Points(geometry, material); //点模型对象
scene.add(points); //点对象添加到场景中
```

##### 线模型Line

```js
// 线条渲染模式
var material=new THREE.LineBasicMaterial({
    color:0xff0000 //线条颜色
});//材质对象
var line=new THREE.Line(geometry,material);//线条模型对象
scene.add(line);//线条对象添加到场景中
```

#### 2.2. 顶点颜色数据插值计算

##### 每个顶点设置一种颜色

几何体的六个顶点分别渲染为几何体设置的顶点颜色数据。

```js
var geometry = new THREE.BufferGeometry(); //声明一个缓冲几何体对象

//类型数组创建顶点位置position数据
var vertices = new Float32Array([
  0, 0, 0, //顶点1坐标
  50, 0, 0, //顶点2坐标
  0, 100, 0, //顶点3坐标

  0, 0, 10, //顶点4坐标
  0, 0, 100, //顶点5坐标
  50, 0, 10, //顶点6坐标
]);
// 创建属性缓冲区对象
var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组，作为一个顶点的xyz坐标
// 设置几何体attributes属性的位置position属性
geometry.attributes.position = attribue;
//类型数组创建顶点颜色color数据
var colors = new Float32Array([
  1, 0, 0, //顶点1颜色
  0, 1, 0, //顶点2颜色
  0, 0, 1, //顶点3颜色

  1, 1, 0, //顶点4颜色
  0, 1, 1, //顶点5颜色
  1, 0, 1, //顶点6颜色
]);
// 设置几何体attributes属性的颜色color属性
geometry.attributes.color = new THREE.BufferAttribute(colors, 3); //3个为一组,表示一个顶点的颜色数据RGB
//材质对象
var material = new THREE.PointsMaterial({
  vertexColors: THREE.VertexColors, //以顶点颜色为准
  size: 10.0 //点对象像素尺寸
});
// 点渲染模式  点模型对象Points
var points = new THREE.Points(geometry, material); //点模型对象
scene.add(points); //点对象添加到场景
```

#### 2.3. 顶点法向量数据光照计算

WebGL中为了计算光线与物体表面入射角，你首先要计算物体表面每个位置的法线方向，在Threejs中表示物体的网格模型Mesh的曲面是由一个一个三角形构成，所以为了表示物体表面各个位置的法线方向，可以给几何体的每个顶点定义一个方向向量。

```js
var normals = new Float32Array([
  0, 0, 1, //顶点1法向量
  0, 0, 1, //顶点2法向量
  0, 0, 1, //顶点3法向量

  0, 1, 0, //顶点4法向量
  0, 1, 0, //顶点5法向量
  0, 1, 0, //顶点6法向量
]);
// 设置几何体attributes属性的位置normal属性
geometry.attributes.normal = new THREE.BufferAttribute(normals, 3); //3个为一组,表示一个顶点的法向量数据
```

#### 2.4. 顶点索引复用顶点数据

比如绘制一个矩形网格模型,至少需要两个三角形拼接而成，两个三角形，每个三角形有三个顶点，也就是说需要定义6个顶点位置数据。对于矩形网格模型而言，两个三角形有两个顶点位置是重合的。也就是说可以重复的位置可以定义一次，然后通过通过顶点数组的索引值获取这些顶点位置数据。  

##### 顶点索引.index

通过几何体BufferGeometry的顶点索引BufferGeometry.index定义了一个矩形。通过顶点索引组织网格模型三角形的绘制，因为矩形的两个三角形有两个顶点位置重复，所以顶点位置数据、顶点法向量数据都只需要定义4个就可以。

```js
ar geometry = new THREE.BufferGeometry(); //声明一个空几何体对象
//类型数组创建顶点位置position数据
var vertices = new Float32Array([
  0, 0, 0, //顶点1坐标
  80, 0, 0, //顶点2坐标
  80, 80, 0, //顶点3坐标
  0, 80, 0, //顶点4坐标
]);
// 创建属性缓冲区对象
var attribue = new THREE.BufferAttribute(vertices, 3); //3个为一组
// 设置几何体attributes属性的位置position属性
geometry.attributes.position = attribue
var normals = new Float32Array([
  0, 0, 1, //顶点1法向量
  0, 0, 1, //顶点2法向量
  0, 0, 1, //顶点3法向量
  0, 0, 1, //顶点4法向量
]);
// 设置几何体attributes属性的位置normal属性
geometry.attributes.normal = new THREE.BufferAttribute(normals, 3); //3个为一组,表示一个顶点的xyz坐标
```

通过顶点索引组织顶点数据，顶点索引数组indexes通过索引值指向顶点位置geometry.attributes.position、顶点法向量geometry.attributes.normal中顶面数组。

```js
// Uint16Array类型数组创建顶点索引数据
var indexes = new Uint16Array([
  // 0对应第1个顶点位置数据、第1个顶点法向量数据
  // 1对应第2个顶点位置数据、第2个顶点法向量数据
  // 索引值3个为一组，表示一个三角形的3个顶点
  0, 1, 2,
  0, 2, 3,
])
// 索引数据赋值给几何体的index属性
geometry.index = new THREE.BufferAttribute(indexes, 1); //1个为一组
```

| 类型数组 | 位数 | 字节 | 类型描述 |
| Int8Array | 8 | 1 | 有符号8位整型 |
| Uint8Array | 8 | 1 | 无符号8位整型 |
| Int16Array | 16 | 2 | 有符号16位整型 |
| Uint16Array | 16 | 2 | 无符号16位整型 |
| Int32Array | 32 | 4 | 有符号32位整型 | int32_t |
| Uint32Array | 32 | 4 | 无符号32位整型 | uint32_t |
| Float32Array | 32 | 4 | 单精度(32位)浮点数 | float |
| Float64Array | 64 | 8 | 双精度(64位)浮点数 | double |

#### 2.5. Face3对象定义Geometry的三角形面

几何体Geometry的三角面属性geometry.faces和缓冲类型几何体BufferGeometry顶点索引属性BufferGeometry.index类似都是顶点位置数据的索引值,用来组织网格模型三角形的绘制。  

通过Face3构建一个三角形，不要设置顶点位置坐标数据，只需要通过数组索引值从geometry.vertices数组中获得顶点位置坐标数据。  

geometry.vertices数组索引0, 1, 2对应的顶点位置坐标数据表示三角形1的三个顶点坐标，索引0, 2, 3对应的顶点位置坐标数据表示三角形2的三个顶点坐标。  

```js
// Face3构造函数创建一个三角面
var face1 = new THREE.Face3(0, 1, 2);
// 三角面2
var face2 = new THREE.Face3(0, 2, 3);
```

##### 三角形法线设置

网格模型Mesh的几何体Geometry本质上都是一个一个三角形拼接而成，所以可以通过设置三角形的法线方向向量来表示几何体表面各个位置的法线方向向量。  

设置三角形法线方向向量有两种方式，一种是直接定义三角形面的法线方向，另一个是定义三角形三个顶点的法线方向数据来表示三角形面法线方向。  

使用三维向量THREE.Vector3表示三角形法线方向数值，然后赋值给三角形对象Face3的法线属性Face3.normal。  

```js
// 三角面2
var face2 = new THREE.Face3(0, 2, 3);
// 设置三角面法向量
face2.normal=new THREE.Vector3(0, -1, 0);
```

换另一种方式，通过三角形面Face3的Face3.vertexNormals属性给三角形的三个顶点分别设置一个顶点法线方向数据。

```js
// Face3构造函数创建一个三角面
var face1 = new THREE.Face3(0, 1, 2);
//三角面每个顶点的法向量
var n1 = new THREE.Vector3(0, 0, -1); //三角面Face1顶点1的法向量
var n2 = new THREE.Vector3(0, 0, -1); //三角面2Face2顶点2的法向量
var n3 = new THREE.Vector3(0, 0, -1); //三角面3Face3顶点3的法向量
// 设置三角面Face3三个顶点的法向量
face1.vertexNormals.push(n1,n2,n3);
```

##### 三角形颜色设置

三角形颜色设置和三角形法线方向设置类型，可以直接设置三角形颜色，也可以设置三角形三个顶点的颜色。

```js
// 三角形1颜色
face1.color = new THREE.Color(0xffff00);
// 设置三角面face1三个顶点的颜色
face1.color = new THREE.Color(0xff00ff);
```

三个顶点颜色不同三角形面渲染的时候会进行颜色插值计算，测到一个颜色渐变效果。

```js
face1.vertexColors = [
  new THREE.Color(0xffff00),
  new THREE.Color(0xff00ff),
  new THREE.Color(0x00ffff),
]
```

#### 2.6. 访问几何体对象的数据

调用BoxGeometry创建一个立方体，执行THREE.BoxGeometry构造函数会自动生成几何体对象的顶点位置坐标、顶点法向量等数据。

```js
var geometry = new THREE.BoxGeometry(100, 100, 100); //创建一个立方体几何对象Geometry
console.log(geometry);
console.log('几何体顶点位置数据',geometry.vertices);
console.log('三角行面数据',geometry.faces);
```

```js
//创建一个矩形平面几何体
var geometry = new THREE.PlaneBufferGeometry(100, 100);
console.log(geometry);
console.log('几何体顶点位置数据',geometry.attributes.position);
console.log('几何体索引数据',geometry.index);
```

#### 2.7. 几何体旋转、缩放、平移变换

![threejs](images/threejs2.png)

通过.scale()、.translate()、.rotateX()等方法可以对几何体本身进行缩放、平移、旋转等几何变换。这些方法对几何体进行变换，注意本质上都是改变结合体顶点位置坐标数据。  

```js
var geometry = new THREE.BoxGeometry(100, 100, 100); //创建一个立方体几何对象Geometry
// 几何体xyz三个方向都放大2倍
geometry.scale(2, 2, 2);
// 几何体沿着x轴平移50
geometry.translate(50, 0, 0);
// 几何体绕着x轴旋转45度
geometry.rotateX(Math.PI / 4);
// 居中：偏移的几何体居中
geometry.center();
console.log(geometry.vertices)
```

> 注意网格模型Mesh进行缩放旋转平移变换和几何体Geometry可以实现相同的渲染效果，但是网格模型Mesh进行这些变换不会影响几何体的顶点位置坐标，网格模型缩放旋转平移变换改变的是模型的本地矩阵、世界矩阵。  

```js
// 几何体xyz方向分别缩放0.5,1.5,2倍
geometry.scale(0.5, 1.5, 2);

// 网格模型xyz方向分别缩放0.5,1.5,2倍
mesh.scale.set(0.5, 1.5, 2)
```








