LIBRARIES = libb64.a

# Build flags (uncomment one)
#############################
# Release build flags
CFLAGS += -O3
#############################
# Debug build flags
#CFLAGS += -g
#############################

SOURCES = cdecode.c  cencode.c serverside.c

TARGETS = $(LIBRARIES)

CC = gcc

LINK.o = gcc

CFLAGS += -Werror -pedantic -std=gnu99
CFLAGS += -Ilibb64-1.2/include

vpath %.h libb64-1.2/include/b64

.PHONY : clean

all: $(TARGETS) executable#strip


executable: cencode.o cdecode.o serverside.o
	$(CC) $(CFLAGS)  cencode.o cdecode.o serverside.o -o test_executable

libb64.a: cencode.o cdecode.o serverside.o
	$(AR) $(ARFLAGS) $@ $^

strip:
	strip $(BINARIES) *.exe

clean:
	rm -f *.exe* *.o $(TARGETS) *.bak *~

distclean: clean
	rm -f depend

depend: $(SOURCES)
	makedepend -f- $(CFLAGS) $(SOURCES) 2> /dev/null 1> depend

-include depend

