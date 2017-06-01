/**
 * Quaternion class
 *
 * We are using C++! Not JavaScript!
 * Unlike JavaScript, "this" keyword is representing a pointer!
 * If you want to access the member variable q[0], you should write
 * this->q[0].
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @copyright The Board of Trustees of the Leland
   Stanford Junior University
 * @version 2017/03/28
 */

#ifndef QUATERNION_H
#define QUATERNION_H

#include "Arduino.h"

#include "Euler.h"

class Quaternion {
public:

  /***
   * public member variables to hold the values
   *
   * Definition:
   * q = q[0] + q[1] * i + q[2] * j + q[3] * k
   */
  double q[4];


  /* Default constructor */
  Quaternion() :
    q{1.0, 0.0, 0.0, 0.0} {}


  /* Cunstructor with some inputs */
  Quaternion(double q0, double q1, double q2, double q3) :
    q{q0, q1, q2, q3} {}


  /* function to create anohter quaternion with the same values. */
  Quaternion clone() {
    return Quaternion(this->q[0], this->q[1], this->q[2], this->q[3]);
  }

  /* function to construct a quaternion from angle-axis representation */
  Quaternion& setFromAngleAxis(double angle, double vx, double vy, double vz) {
    /***
     * TODO: Implement!
     */
		// this function accepts angles in degrees
		
		this->q[0] = cos(angle*PI/360);
		this->q[1] = vx * sin(angle*PI/360);
		this->q[2] = vy * sin(angle*PI/360);
		this->q[3] = vz * sin(angle*PI/360);

    return *this;
  }

  /* function to compute the length of a quaternion */
  double length() {
    /***
     * TODO: Implement!
     */
		
    return sqrt(sq(this->q[0]) + sq(this->q[1]) + sq(this->q[2]) + sq(this->q[3]));
  }

  /* function to normalize a quaternion */
  Quaternion& normalize() {
    /***
     * TODO: Implement!
     */
		double length = this->length();

		this->q[0] /= length;
		this->q[1] /= length;
		this->q[2] /= length;
		this->q[3] /= length;

    return *this;
  }

  /* function to invert a quaternion */
  Quaternion& inverse() {
    /***
     * TODO: Implement!
     */
		
		double length = this->length();

		this->q[0] *= 1.0/sq(length);
		this->q[1] *= -1.0/sq(length);
		this->q[2] *= -1.0/sq(length);
		this->q[3] *= -1.0/sq(length);

    return *this;
  }

  /* function to multiply two quaternions */
  Quaternion multiply(Quaternion& a, Quaternion& b) {
    /***
     * TODO: Implement!
     */
		
		double res[4];
		res[0] = (a.q[0] * b.q[0]) - (a.q[1] * b.q[1]) - (a.q[2] * b.q[2]) - (a.q[3] * b.q[3]);
		res[1] = (a.q[0] * b.q[1]) + (a.q[1] * b.q[0]) + (a.q[2] * b.q[3]) - (a.q[3] * b.q[2]);
		res[2] = (a.q[0] * b.q[2]) - (a.q[1] * b.q[3]) + (a.q[2] * b.q[0]) + (a.q[3] * b.q[1]);
		res[3] = (a.q[0] * b.q[3]) + (a.q[1] * b.q[2]) - (a.q[2] * b.q[1]) + (a.q[3] * b.q[0]);
    return Quaternion(res[0], res[1], res[2], res[3]);
  }

  /* function to rotate a quaternion by r * q * r^{-1} */
  Quaternion rotate(Quaternion& r) {
    /***
     * TODO: Implement!
     */

   	Quaternion one = multiply(r, *this);
		Quaternion two = r.clone().inverse();	
		return multiply(one, two);
		
		//return Quaternion();
  }

  /* helper function to print out a quaternion */
  void serialPrint() {
    Serial.printf("[%f %f %f %f]\n", q[0], q[1], q[2], q[3]);
  }
};

#endif // ifndef QUATERNION_H
