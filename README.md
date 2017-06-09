# EE267 Final Project
Rahul Prabala // Alex Bertrand

## Code Breakdown
### Camera Operation and Data Capture
### Node Server
The camera captures image and depth data and sends it to a server via a websocket. This server is runs locally on Node.js and essentially acts as a piece of middleware between the camera and the client side. Minimal data processing is done here; for the most part data just goes in and out. The notable exception to this is that the node server is responsible for concatenating the data chunks that correspond to a single frame. Packets come in at sizes of up to 65536 bytes and must be aggregated in groups to compose the full data for a given image.

Once the server has received enough image data to comprise a full frame it sends it via (another socket) to the client side. This will be where most of the relevant processing happens.

One other thing to note is that the depth and image data are sent in parallel. Rather than attempting to alternate between the two we opted instead to open a second socket for depth data. This means that in total, the server is making use of 4 sockets - image in, image out, depth in, and depth out.

### Front End
#### Image Loading
Once the depth and image data from a given frame reach the front end, data processing can begin. The scene is layed out as a large planar mesh directly in front of the viewer. To this end, each frame's image data is dynamically loaded as a [DataTexture](https://threejs.org/docs/#api/textures/DataTexture) and applied to the plane. While we acknowledge that this probably isn't the fastest way to operate, we believe it made sense given the time frame and prototypical nature of the project.

#### Waddle Dees
Directly in front of the image plane we have placed a Waddle Dee (see link above). Waddle Dees serves as our test subjects - the goal here is to render them invisible when they are 'behind' the objects in the captured image but not when they are 'in front'. We determine this by assigning the Waddle Dees an arbitrary z position (0 to 255) and then comparing it to depth data received from the camera.

#### Occlusion
The plane is placed directly in front of the viewer and at a reasonable distance - it essentially serves as the 'back wall' of the viewport and thus by default is behind the Waddle Dees. Occlusion happens, then, via a grid of invisible blocks placed in front of both the Waddle Dees and the image plane. Through use of the `renderOrder` property of objects in THREE.js we were able to modify rendering such that these blocks would occlude Waddle Dees while remaining transparent with respect to the background image. The end effect is that the background image is visible at all times, while the Waddle Dees are not, depending on whether they are behind an occlusion block.

Occlusion blocks are layed out in a grid over the background image. Their z value is determined by the depth data that corresponds to the point in the image directly below their position. Blocks in front of 'close' areas of the image are placed closer to the viewer (and thus occlude the waddle dees) while blocks in front of 'further' areas of the image are placed much closer to the background plane.

#### Performance Optimization
As one might imagine, streaming live video and performing 3d rendering on top of it turned out to be a somewhat computationally intensive task. To get it running with any degree of smoothness we implemented some optimizing techniques:
- Direct transfer of image data. While this may seem intuitive, it took us a good two or three tries to hit upon the most efficient transfer of data. Javascript does a lot of funky things that, in general, try as hard as possible to avoid data in raw binary form. Unfortunately, this was exactly what we wanted. We eventually managed to force this to work.
- 'Binary' Occlusion data. Originally we updated the position of each block to directly correspond to the underlying depth data, that is, blocks could assume z values along the entire range from image to viewer. This gave us problems with mainting tile uniformity - as the blocks got closer to the viewer they also appeared to shift outward and thus left holes in the grid. This resulted in a subpar experience in which the Waddle Dees could peak through small holes of particularly close objects. While we could have fixed this by computing the correct position and size for the block at any z value to maintain a smooth grid, this would have resulted in even more math to perform and a generally slower frame rate. Instead, we opted to keep blocks very close to the image and choose between only two values for their z position - either immediately in front of the background plane for 'not blocking' or a short distance ahead (and in front of the waddle dee) for 'blocking'.
