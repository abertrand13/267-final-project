# EE267 Final Project
Rahul Prabala // Alex Bertrand

## Full Requirements  
- Ubuntu 14.04 (host)
- Jetson TX1 (running Ubuntu 16.04)
- RealSense SR300 
- C++
- WebGL Compatible Browser
- Node.js 6.11.0+
 
## Demo Requirements
- Ubuntu 14.04 / modern UNIX operating system
- WebGL Compatible Browser
- Node.js 6.11.0+
- C++

 
## Overview
The code for this project is intended to run on the NVIDIA Jetson TX1, connected to an Intel RealSense SR300 camera. However, for purposes of demonstration, we have included a test executable that will display the streaming capabilities and interfaces. This will not capture live video, however, but does illustrate the performance.
 
If running on a Jetson TX1, a precompiled zImage and Image are provided, as well as a precompiled kernel module for uvcvideo in order to interface with the RealSense. The RealSense does integrate with other operating systems, but is not supported by this code. See the librealsense repository for more information and installation instructions for your specific operating system.
 
The code is broken into three primary partitions: C++ and kernel interfaces to the camera, a node.js server to act as middleware and as a pipe, and finally, a THREE.js based renderer built on WebGL. We use two types of sockets to communicate between the three layers.
 
 
## Setup
If running on the Jetson TX1, move the zImage and Image to the boot directory, and restart the machine for the images to take effect. We include all binaries that are intended for the Jetson TX1, as well as the source.
 
For running on more traditional machines, the requirements are to be able to compile a C/C++ application and to have a WebGL compatible browser. The test application will open sockets on ports 3490, 3491, 3000, 8081, and 8082. Please make sure nothing else is running and using those ports. A Makefile is included for the test executable.
 
 
To install the node requisites, run ‘npm install’ in the main directory with app.js. The provided package.json file will automatically install the node dependencies. An executable of node for AARCH64 (64-bit ARMv8) based machines is included in the directory. Please use the latest version of node compatible with your machine architecture. The latest executables can be found at https://nodejs.org/en/.

 
## Running
First, the node server must be started: run ‘node app.js’. Once the node server has started, open a WebGL compatible browser and navigate to localhost:8080. The page should render, and you will see a [Waddle Dee](http://kirby.wikia.com/wiki/Waddle_Dee) bouncing on top of a black image. Next, navigate to either the test_executable app or the cpp_headless application depending on the target machine. The executable is run at the commandline as follows: ‘./test_executable localhost’. It takes as argument the server that it should connect to, in this case localhost as everything is run locally. However, this can be extended in the future to connect to arbitrary devices.

The main functionality is contained within the following source files: app.js runs the node server; render.html, StandardRenderer.js, StateController.js run the front end and rendering; and the C++ code is within cpp-headless.cpp and serverside.c. 

## Code Breakdown
### Camera Operation and Capture
 
The Jetson-based code additionally consists of two parts: librealsense, the cross-platform Intel camera API that supports their SDK (but is inherently different from it), and the application that combines the C socket API and camera functionality.
 
#### Kernel Patch and librealsense
As stated in the overview, the Jetson TX1 is not compatible with librealsense out of the box. The kernel must be patched to accept the new video formats supported by the RealSense cameras. Afterwards, the uvcvideo kernel module is changed to be dynamically inserted as a kernel module at runtime. We include both a patched kernel, and a patched uvcvideo.ko, but the zImage and Image have these changes already incorporated, as well as additional tweaks for libusb and USB auto shutdown, so a new user running on the TX1 does not need to redo this work. 
 
We also provide a script to install librealsense on the Jetson TX1. However, it should be noted that this script will NOT work on any machine that is not the TX1 or running similar architecture. Additional patches to librealsense are required to set up the proper udev permissions, as these are different for different kernel versions. Librealsense assumes the latest Linux kernel, but this is not supported by the Jetson TX1, thus a few changes are made to ensure that this will install.
 
#### C++ Application
In order to achieve maximal performance, the C++ code relies on UNIX domain sockets to communicate with the node.js server. While originally our plan was to rely on file I/O to transfer data between the camera and node.js server, the framerates are unacceptably low for user interaction. To alleviate this problem, we use the TCP/IP network stack in the kernel with the C socket API. The C++ application is a client: it assumes a known port number and attempts to connect to the locally running node server. 
 
Once connected, the application grabs a set of frames (RGB + depth) from the camera, and transmits them over separate sockets to the node server. This transfer is on the order of 1MB per set of frames, so future users should take care to ensure that the network and memory subsystem is capable of handling this load. 
 
We include a base64 encoding library for debugging purposes. Base64 maps byte-representable data (0-255) into 64 ASCII characters that are universally available. If users have issues with connecting or viewing the stream of data, it is recommended to use the base64 library and convert the raw stream into a string. The data can be decoded at the destination. This is inherently slow, however, and should be used only as a debugging tool.

The test executable will stream one frame of RGB and one frame of depth to the browser. The RGB image is a simple gradient, with the pixel value equal to the index modulo 255. The depth image will occlude the Waddle Dee at the bottom of the screen.


### Node Server
The camera captures image and depth data and sends it to a server via a websocket. This server is runs locally on Node.js and essentially acts as a piece of middleware between the camera and the client side. Minimal data processing is done here; for the most part data just goes in and out. The notable exception to this is that the node server is responsible for concatenating the data chunks that correspond to a single frame. Packets come in at sizes of up to 65536 bytes and must be aggregated in groups to compose the full data for a given image.

Once the server has received enough image data to comprise a full frame it sends it via (another socket) to the client side. This will be where most of the relevant processing happens.

One other thing to note is that the depth and image data are sent in parallel. Rather than attempting to alternate between the two we opted instead to open a second socket for depth data. This means that in total, the server is making use of 4 sockets - image in, image out, depth in, and depth out.

### Front End
#### Image Loading
Once the depth and image data from a given frame reach the front end, data processing can begin. The scene is layed out as a large planar mesh directly in front of the viewer. To this end, each frame's image data is dynamically loaded as a [DataTexture](https://threejs.org/docs/#api/textures/DataTexture) and applied to the plane.

#### Waddle Dees
Directly in front of the image plane we have placed a Waddle Dee (see link above). Waddle Dees serves as our test subjects - the goal here is to render them invisible when they are 'behind' the objects in the captured image but not when they are 'in front'. We determine this by assigning the Waddle Dees an arbitrary z position (0 to 255) and then comparing it to depth data received from the camera.

#### Occlusion
The plane is placed directly in front of the viewer and at a reasonable distance - it essentially serves as the 'back wall' of the viewport and thus by default is behind the Waddle Dees. Occlusion happens, then, via a grid of invisible blocks placed in front of both the Waddle Dees and the image plane. Through use of the `renderOrder` property of objects in THREE.js we were able to modify rendering such that these blocks would occlude Waddle Dees while remaining transparent with respect to the background image. The end effect is that the background image is visible at all times, while the Waddle Dees are not, depending on whether they are behind an occlusion block.

Occlusion blocks are layed out in a grid over the background image. Their z value is determined by the depth data that corresponds to the point in the image directly below their position. Blocks in front of 'close' areas of the image are placed closer to the viewer (and thus occlude the waddle dees) while blocks in front of 'further' areas of the image are placed much closer to the background plane.

#### Performance Optimization
As one might imagine, streaming live video and performing 3d rendering on top of it turned out to be a somewhat computationally intensive task. To get it running with any degree of smoothness we implemented some optimizing techniques:
- Direct transfer of image data. Javascript attempts to avoid data in raw binary form. However, we were able to convert all of the sockets and streams to use raw buffers of data.
- Occlusion data grid. We updated the position of each block to directly correspond to the underlying depth data, that is, blocks could assume z values along the entire range from image to viewer. This gave us problems with maintaining tile uniformity - as the blocks got closer to the viewer they also appeared to shift outward and thus left holes in the grid. This resulted in a subpar experience in which the Waddle Dees could peak through small holes of particularly close objects. To avoid incurring demonstrated large frame rate drops to transform this, we mapped the total depth range to a much smaller region around the Waddle Dee. This allows for very quick computations of occlusions based on depth data, taking advantage of the inbuilt z-occlusion scheme in WebGL and THREE.js. Additionally, this becomes much more visually pleasing for the viewer, as the holes between blocks no longer exist.
