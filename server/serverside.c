#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <netdb.h>
#include <sys/types.h>
#include <netinet/in.h>
#include <sys/socket.h>

#include "libb64-1.2/include/b64/cencode.h"
#include "libb64-1.2/include/b64/cdecode.h"

#include <arpa/inet.h>
#define IMAGE_SIZE (640*480*3)
#define PORT "3490" // the port RGB client will be connecting to


// Whether or not we should use base64
#define USE_BASE64 0


// get sockaddr, IPv4 or IPv6:
void *get_in_addr(struct sockaddr *sa)
{
    if (sa->sa_family == AF_INET) {
        return &(((struct sockaddr_in*)sa)->sin_addr);
    }

    return &(((struct sockaddr_in6*)sa)->sin6_addr);
}

int main(int argc, char *argv[])
{
    base64_encodestate b64_state;
    base64_init_encodestate(&b64_state);
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

    freeaddrinfo(servinfo);

    // Get second socket with port 3491
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

    // have first socket for rgb stored in sockfd and
    // second socket for depth in sockfd2


    // for use with base64
    // NOTE: Base64 encoding requires 4/3 the amount of memory to encode the data
#if USE_BASE64
    uint8_t img_out[4*640*480];
    printf("%d", base64_encode_block((const char *)img_test, IMAGE_SIZE, (char*)img_out, &b64_state));
    base64_decodestate outstate;
    base64_init_decodestate(&outstate);
    uint8_t img_decoded[3*640*480];
    base64_decode_block((const char*)img_out, 4*640*480, (char*)img_decoded, &outstate);

    // double-check base64 encoding
    for (int i = 0; i < IMAGE_SIZE; i++)
    {
        if (img_test[i] != img_decoded[i])
            printf("incorrect at %d: %d \n", i, img_decoded[i]);
    }

    if ((numbytes = send(sockfd, img_out, 4*640*480, 0)) == -1) {
        perror("send");
        exit(1);
    }
    send(sockfd, "\n", 1, 0);
#endif

    // test RGB pattern
    uint8_t img_test[IMAGE_SIZE];
    for (int i = 0; i < IMAGE_SIZE; i++)
    {
        img_test[i] = i % 255;
    }
    // send RGB pattern
    if ((numbytes = send(sockfd, img_test, 3*640*480, 0)) == -1) {
        perror("send");
        exit(1);
    }
    send(sockfd, "\n", 1, 0);


    // Generate example depth data: the Waddle Dee will be occluded
    // in the bottom half of the screen
    uint8_t img_depth[640*480];
    for (int i = 0; i < 240*640; i++)
    {
        img_depth[i] = 20;
    }

    for (int i = 240*640; i < 480*640; i++)
    {
        img_depth[i] = 255;
    }


    if ((numbytes = send(sockfd2, img_depth, 1*640*480, 0)) == -1) {
        perror("send");
        exit(1);
    }
    send(sockfd2, "\n", 1, 0);


    // cleanup
    close(sockfd);
    close(sockfd2);


    return 0;
}

