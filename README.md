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

## 2. 基础概念

WebGL每次绘制需要两个着色器， 一个顶点着色器和一个片断着色器，每一个着色器都是一个方法。 一个顶点着色器和一个片断着色器链接在一起放入一个着色程序中（或者只叫程序）。 一个典型的WebGL应用会有多个着色程序。

### 2.1. 顶点着色器

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

#### 2.1.1. Attributes 属性

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

#### 2.1.2. Uniforms 全局变量

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

### 2.2. 片断着色器

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

#### 2.2.1. Uniform 全局变量（片断着色器中）
同 Uniforms 全局变量.

#### 2.2.2. Textures 纹理（片断着色器中）

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

#### 2.2.3. Varyings 可变量

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







### 2.3. GLSL

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

## 3. 常用api

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

