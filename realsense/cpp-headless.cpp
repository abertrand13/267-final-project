// License: Apache 2.0. See LICENSE file in root directory.
// Copyright(c) 2015 Intel Corporation. All Rights Reserved.

///////////////////
// cpp-headless  //
///////////////////

// This sample captures 30 frames and writes the last frame to disk.
// It can be useful for debugging an embedded system with no display.

#include <librealsense/rs.hpp>

#include <cstdio>
#include <stdint.h>
#include <vector>
#include <map>
#include <limits>
#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <netdb.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>

#include "server/libb64-1.2/include/b64/cencode.h"
#include "server/libb64-1.2/include/b64/cdecode.h"

#include <arpa/inet.h>
#define IMAGE_SIZE (640*480*3)
#define PORT "3490" // the port client will be connecting to

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "third_party/stb_image_write.h"

const int CHARS_PER_LINE = 10000000;

void base64_init_encodestate(base64_encodestate* state_in)
{
	state_in->step = step_A;
	state_in->result = 0;
	state_in->stepcount = 0;
}

char base64_encode_value(char value_in)
{
	static const char* encoding = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	if (value_in > 63) return '=';
	return encoding[(int)value_in];
}

int base64_encode_block(const char* plaintext_in, int length_in, char* code_out, base64_encodestate* state_in)
{
	const char* plainchar = plaintext_in;
	const char* const plaintextend = plaintext_in + length_in;
	char* codechar = code_out;
	char result;
	char fragment;

	result = state_in->result;

	switch (state_in->step)
	{
		while (1)
		{
	case step_A:
			if (plainchar == plaintextend)
			{
				state_in->result = result;
				state_in->step = step_A;
				return codechar - code_out;
			}
			fragment = *plainchar++;
			result = (fragment & 0x0fc) >> 2;
			*codechar++ = base64_encode_value(result);
			result = (fragment & 0x003) << 4;
	case step_B:
			if (plainchar == plaintextend)
			{
				state_in->result = result;
				state_in->step = step_B;
				return codechar - code_out;
			}
			fragment = *plainchar++;
			result |= (fragment & 0x0f0) >> 4;
			*codechar++ = base64_encode_value(result);
			result = (fragment & 0x00f) << 2;
	case step_C:
			if (plainchar == plaintextend)
			{
				state_in->result = result;
				state_in->step = step_C;
				return codechar - code_out;
			}
			fragment = *plainchar++;
			result |= (fragment & 0x0c0) >> 6;
			*codechar++ = base64_encode_value(result);
			result  = (fragment & 0x03f) >> 0;
			*codechar++ = base64_encode_value(result);

			++(state_in->stepcount);
			if (state_in->stepcount == CHARS_PER_LINE/4)
			{
				*codechar++ = '\n';
				state_in->stepcount = 0;
			}
		}
	}
	/* control should not reach here */
	printf("HERE AND ITS BAD\n");
	return codechar - code_out;
}

int base64_encode_blockend(char* code_out, base64_encodestate* state_in)
{
	char* codechar = code_out;

	switch (state_in->step)
	{
	case step_B:
		*codechar++ = base64_encode_value(state_in->result);
		*codechar++ = '=';
		*codechar++ = '=';
		break;
	case step_C:
		*codechar++ = base64_encode_value(state_in->result);
		*codechar++ = '=';
		break;
	case step_A:
		break;
	}
	*codechar++ = '\n';

	return codechar - code_out;
}










//~ void normalize_depth_to_rgb(uint8_t rgb_image[], const uint16_t depth_image[], int width, int height)
//~ {
    //~ for (int i = 0; i < width * height; ++i)
    //~ {
        //~ if (auto d = depth_image[i])
        //~ {
            //~ uint8_t v = d * 255 / std::numeric_limits<uint16_t>::max();
            //~ rgb_image[i*3 + 0] = 255 - v;
            //~ rgb_image[i*3 + 1] = 255 - v;
            //~ rgb_image[i*3 + 2] = 255 - v;
        //~ }
        //~ else
        //~ {
            //~ rgb_image[i*3 + 0] = 0;
            //~ rgb_image[i*3 + 1] = 0;
            //~ rgb_image[i*3 + 2] = 0;
        //~ }
    //~ }
//~ }


void normalize_depth_to_rgb(uint8_t rgb_image[], const uint16_t depth_image[], int width, int height)
{
    for (int i = 0; i < width * height; ++i)
    {
        if (auto d = depth_image[i])
        {
            uint8_t v = d * 255 / std::numeric_limits<uint16_t>::max();
            rgb_image[i + 0] = v;
            //~ rgb_image[i*3 + 1] = 255 - v;
            //~ rgb_image[i*3 + 2] = 255 - v;
        }
        else
        {
            rgb_image[i + 0] = 0;
            //~ rgb_image[i*3 + 1] = 0;
            //~ rgb_image[i*3 + 2] = 0;
        }
    }
}

std::map<rs::stream,int> components_map =
{
    { rs::stream::depth,     3  },      // RGB
    { rs::stream::color,     3  },
    { rs::stream::infrared , 1  },      // Monochromatic
    { rs::stream::infrared2, 1  },
    { rs::stream::fisheye,   1  }
};

struct stream_record
{
    stream_record(void): frame_data(nullptr) {};
    stream_record(rs::stream value): stream(value), frame_data(nullptr) {};
    ~stream_record() { frame_data = nullptr;}
    rs::stream          stream;
    rs::intrinsics      intrinsics;
    unsigned char   *   frame_data;
};

void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}


int main(int argc, char *argv[]) try
{
	
	
    int sockfd, numbytes, sockfd2;
    struct addrinfo hints, *servinfo, *p;
    int rv;
    char s[INET6_ADDRSTRLEN];
    
    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    if ((rv = getaddrinfo(argv[1], "3490", &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // loop through all the results and connect to the first we can
    for(p = servinfo; p != NULL; p = p->ai_next) {
        if ((sockfd = socket(p->ai_family, p->ai_socktype,
                p->ai_protocol)) == -1) {
            perror("client: socket");
            continue;
        }

        if (connect(sockfd, p->ai_addr, p->ai_addrlen) == -1) {
            close(sockfd);
            perror("client: connect");
            continue;
        }

        break;
    }

    if (p == NULL) {
        fprintf(stderr, "client: failed to connect\n");
        return 2;
    }

    inet_ntop(p->ai_family, get_in_addr((struct sockaddr *)p->ai_addr),
            s, sizeof s);
    printf("client: connecting to %s\n", s);

    freeaddrinfo(servinfo); // all done with this structure
    
    // ====
    
    memset(&hints, 0, sizeof hints);
    hints.ai_family = AF_UNSPEC;
    hints.ai_socktype = SOCK_STREAM;

    if ((rv = getaddrinfo(argv[1], "3491", &hints, &servinfo)) != 0) {
        fprintf(stderr, "getaddrinfo: %s\n", gai_strerror(rv));
        return 1;
    }

    // loop through all the results and connect to the first we can
    for(p = servinfo; p != NULL; p = p->ai_next) {
        if ((sockfd2 = socket(p->ai_family, p->ai_socktype,
                p->ai_protocol)) == -1) {
            perror("client: socket");
            continue;
        }

        if (connect(sockfd2, p->ai_addr, p->ai_addrlen) == -1) {
            close(sockfd2);
            perror("client: connect");
            continue;
        }

        break;
    }

    if (p == NULL) {
        fprintf(stderr, "client: failed to connect\n");
        return 2;
    }

    inet_ntop(p->ai_family, get_in_addr((struct sockaddr *)p->ai_addr),
            s, sizeof s);
    printf("client: connecting to %s\n", s);

    freeaddrinfo(servinfo); // all done with this structure
    
    
    
    //======================================================================
    
    
    rs::log_to_console(rs::log_severity::warn);
    //rs::log_to_file(rs::log_severity::debug, "librealsense.log");

    rs::context ctx;
    printf("There are %d connected RealSense devices.\n", ctx.get_device_count());
    if(ctx.get_device_count() == 0) return EXIT_FAILURE;

    rs::device * dev = ctx.get_device(0);
    printf("\nUsing device 0, an %s\n", dev->get_name());
    printf("    Serial number: %s\n", dev->get_serial());
    printf("    Firmware version: %s\n", dev->get_firmware_version());

    std::vector<stream_record> supported_streams;

    for (int i=(int)rs::capabilities::depth; i <=(int)rs::capabilities::fish_eye; i++)
        if (dev->supports((rs::capabilities)i))
            supported_streams.push_back(stream_record((rs::stream)i));

    for (auto & stream_record : supported_streams)
        dev->enable_stream(stream_record.stream, rs::preset::best_quality);

    /* activate video streaming */
    dev->start();

    /* retrieve actual frame size for each enabled stream*/
    for (auto & stream_record : supported_streams)
        stream_record.intrinsics = dev->get_stream_intrinsics(stream_record.stream);

    /* Capture 30 frames to give autoexposure, etc. a chance to settle */
    for (int i = 0; i < 30; ++i) dev->wait_for_frames();


	char *img_out_rgb = new char [640*480*4];
	char *img_out = new char [640*640];


	for (int test = 0; test<2000; test++)
	{
		


    /* Retrieve data from all the enabled streams */
    for (auto & stream_record : supported_streams)
        stream_record.frame_data = const_cast<uint8_t *>((const uint8_t*)dev->get_frame_data(stream_record.stream));

    /* Transform Depth range map into uint8 map */
    stream_record depth = supported_streams[(int)rs::stream::depth];
    std::vector<uint8_t> coloredDepth(depth.intrinsics.width * depth.intrinsics.height);

    /* Encode depth data into color image */
    normalize_depth_to_rgb(coloredDepth.data(), (const uint16_t *)depth.frame_data, depth.intrinsics.width, depth.intrinsics.height);

    /* Update captured data */
    supported_streams[(int)rs::stream::depth].frame_data = coloredDepth.data();

	
    /* Store captured frames into current directory */
    for (auto & captured : supported_streams)
    {
					std::stringstream ss;
					

		if (captured.stream == rs::stream::color){
			
			
			base64_encodestate b64_state;
			base64_init_encodestate(&b64_state);
			
			
			//~ const uint8_t *test = (const uint8_t *) captured.frame_data;
			//~ char img_test [640*480*3];
			//~ for (int i = 0; i < 640*480*3;i++)
			//~ {
				//~ img_test[i] = 3 % 255;
			//~ }
			//~ base64_encode_block((const char *)captured.frame_data,640*480*3, (char*)img_out_rgb, &b64_state);
			//~ base64_encode_block((const char *)img_test,640*480*3, (char*)img_out, &b64_state);

			//~ std::cout << "encoded data" << std::endl;
			if ((numbytes = send(sockfd, captured.frame_data, 3*640*480, 0)) == -1) {
				perror("send");
				exit(1);
			}
			send(sockfd,"\n", 1, 0);
			std::cout << "sent rgb data" << std::endl;
		}
		if (captured.stream == rs::stream::depth)
		{
			base64_encodestate b64_state;
			base64_init_encodestate(&b64_state);
			//~ base64_encode_block((const char *)captured.frame_data,640*480, (char*)img_out, &b64_state);
			//~ std::cout << "encoded data" << std::endl;
			if ((numbytes = send(sockfd2, captured.frame_data, 640*480, 0)) == -1) {
				perror("send");
				exit(1);
			}
			send(sockfd2,"\n", 1, 0);
			std::cout << "sent depth data" << std::endl;
			
			stbi_write_png("test_depth.png",
            captured.intrinsics.width,captured.intrinsics.height,
            1,
            captured.frame_data,
            captured.intrinsics.width  );
			
			
			
		}
		
		//~ usleep(1000*75);
        
        
    }
		dev->wait_for_frames();
	}
    printf("wrote frames to current working directory.\n");
    close(sockfd);
    close(sockfd2);
    delete [] img_out_rgb;
	delete [] img_out;
    return EXIT_SUCCESS;
}
catch(const rs::error & e)
{
    std::cerr << "RealSense error calling " << e.get_failed_function() << "(" << e.get_failed_args() << "):\n    " << e.what() << std::endl;
    return EXIT_FAILURE;
}
catch(const std::exception & e)
{
    std::cerr << e.what() << std::endl;
    return EXIT_FAILURE;
}
