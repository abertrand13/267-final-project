/**
 * EE267 Virtual Reality
 * Homework 5
 * Inertial Measurement Units and Sensor Fusion
 *
 * Instructor: Gordon Wetzstein <gordon.wetzstein@stanford.edu>,
 *         Robert Konrad <rkkonrad@stanford.edu>,
 *         Hayato Ikoma <hikoma@stanford.edu>,
 *         Keenan Molner <kmolner@stanford.edu>
 *
 * @author Hayato Ikoma <hikoma@stanford.edu>
 * @author Gordon Wetzstein <gordon.wetzstein@stanford.edu>,
 * @copyright The Board of Trustees of the Leland
   Stanford Junior University
 * @version 2017/03/28
 *
 */


/* Our IMU class */
#include "imu.h"

/* Our Quaternion class */
#include "Quaternion.h"

/* Our Euler class */
#include "Euler.h"

/* math include */
#include <math.h>

/***
 * Variable to set if the measureBias function will be executed. If the bias
 * measurement is executed, the estiamted values will be used for the
 * orientation tracking. If not, the default values of gyrBias will be used.
 */
const bool findBias = true;


/***
 * Measured bias
 *
 * TODO:
 * Estimate the bias for all measurements and put the estimated values here.
 * Those values should be used in loop().
 */
double gyrBiasX = 0, gyrBiasY = 0, gyrBiasZ = 0;
double accBiasX = 0, accBiasY = 0, accBiasZ = 0;
double magBiasX = 0, magBiasY = 0, magBiasZ = 0;


/***
 * Integrated gyroscope measurements
 *
 * TODO:
 * Integrate the gyrosope measurements in these variables.
 */
double gyrIntX = 0, gyrIntY = 0, gyrIntZ = 0;


/* Variables for streaming data (euler and quaternion based on complementary
   filter) */
Euler eulerCmp  = Euler();
Quaternion qCmp = Quaternion();


/***
 * Imu class instance
 * This class is used to read the measurements.
 */
Imu imu = Imu();


/***
 * Helper function and variables to stream data
 * Change the variable streamingMode to switch which variables you would like
 * to stream into the serial communication.
 *
 * Feel free to add other data for debugging.
 */
const int NONE       = 0;
const int EULER      = 1;
const int QUATERNION = 2;
const int GYR        = 3;
const int ACC        = 4;
const int MAG        = 5;
const int GYRINT     = 6;
const int DEBUG			 = 7;

int streamingMode = 3;

void streamData() {
  switch (streamingMode) {
  case NONE:
    break;

  case EULER:
    Serial.printf("EC %f %f %f\n",
                  eulerCmp.pitch, eulerCmp.yaw, eulerCmp.roll);
    break;

  case QUATERNION:
    Serial.printf("QC %f %f %f %f\n",
                  qCmp.q[0], qCmp.q[1], qCmp.q[2], qCmp.q[3]);
    break;

  case GYR:
    Serial.printf("GYR %f %f %f\n", imu.gyrX, imu.gyrY, imu.gyrZ);
    break;

  case ACC:
    Serial.printf("ACC %f %f %f\n", imu.accX, imu.accY, imu.accZ);
    break;

  case MAG:
    Serial.printf("MAG %f %f %f\n", imu.magX, imu.magY, imu.magZ);
    break;

  case GYRINT:
    Serial.printf("GYRINT %f %f %f\n", gyrIntX, gyrIntY, gyrIntZ);
    break;

	case DEBUG:
		Serial.printf("LALALA %f %f\n", gyrIntX, eulerCmp.pitch);
  }
}

/* Helper function to get the sign of a value */
double sign(double value) {
  return double((value > 0) - (value < 0));
}

/**
 * This function is used to measure the bias and variance of the measurements.
 * The estimation is performed by taking 1000 measurements. This function should
 * be executed by placing Arduino stedy.
 */
void measureBias() {
  gyrBiasX = 0, gyrBiasY = 0, gyrBiasZ = 0;
  accBiasX = 0, accBiasY = 0, accBiasZ = 0;
  magBiasX = 0, magBiasY = 0, magBiasZ = 0;

  double gyrVarX = 0, gyrVarY = 0, gyrVarZ = 0;
  double accVarX = 0, accVarY = 0, accVarZ = 0;
  double magVarX = 0, magVarY = 0, magVarZ = 0;

  /***
   * Read IMU data!
   *
   * The measured values are stored in its member variables.
   * You can access them by
   * imu.gyrX, imu.gyrY, imu.gyrZ
   * imu.accX, imu.accY, imu.accZ
   * imu.magX, imu.magY, imu.magZ
   */
  for (int i = 0; i < 1000; i++)
  {
    imu.read();
    gyrBiasX += imu.gyrX;
    gyrBiasY += imu.gyrY;
    gyrBiasZ += imu.gyrZ;

    accBiasX += imu.accX;
    accBiasY += imu.accY;
    accBiasZ += imu.accZ;

    magBiasX += imu.magX;
    magBiasY += imu.magY;
    magBiasZ += imu.magZ;

    // delay(10);


  }

  gyrBiasX /= 1000;
  gyrBiasY /= 1000;
  gyrBiasZ /= 1000;

  accBiasX /= 1000;
  accBiasY /= 1000;
  accBiasZ /= 1000;

  magBiasX /= 1000;
  magBiasY /= 1000;
  magBiasZ /= 1000;


  // Variance = 1/(N-1)*(x_i - \bar{mu})
  for (int i = 0; i < 1000; i++)
  {
      imu.read();
      gyrVarX += (imu.gyrX - gyrBiasX) * (imu.gyrX - gyrBiasX);
      gyrVarY += (imu.gyrY - gyrBiasY) * (imu.gyrY - gyrBiasY);
      gyrVarZ += (imu.gyrZ - gyrBiasZ) * (imu.gyrZ - gyrBiasZ);

      accVarX += (imu.accX - accBiasX) * (imu.accX - accBiasX);
      accVarY += (imu.accY - accBiasY) * (imu.accY - accBiasY);
      accVarZ += (imu.accZ - accBiasZ) * (imu.accZ - accBiasZ);

      magVarX += (imu.magX - magBiasX) * (imu.magX - magBiasX);
      magVarY += (imu.magY - magBiasY) * (imu.magY - magBiasY);
      magVarZ += (imu.magZ - magBiasZ) * (imu.magZ - magBiasZ);
  }

  gyrVarX /= 999;
  gyrVarY /= 999;
  gyrVarZ /= 999;

  accVarX /= 999;
  accVarY /= 999;
  accVarZ /= 999;

  magVarX /= 999;
  magVarY /= 999;
  magVarZ /= 999;


  Serial.printf("X bias: g: %f, m: %f, a: %f\n",
                gyrBiasX, magBiasX, accBiasX);
  Serial.printf("Y bias: g: %f, m: %f, a: %f\n",
                gyrBiasY, magBiasY, accBiasY);
  Serial.printf("Z bias: g: %f, m: %f, a: %f\n",
                gyrBiasZ, magBiasZ, accBiasZ);

  Serial.printf("X variance: g: %f, m: %f, a: %f\n",
                gyrVarX, magVarX, accVarX);
  Serial.printf("Y variance: g: %f, m: %f, a: %f\n",
                gyrVarY, magVarY, accVarY);
  Serial.printf("Z variance: g: %f, m: %f, a: %f\n",
                gyrVarZ, magVarZ, accVarZ);
}

/* Set up Arduino */
void setup() {
  /* Initialize serial communication */
  delay(1000);
  Serial.begin(115200);
  delay(100);
  Serial.println("Serial communication started...");
  delay(1000);

  /* initialize IMU */
  imu.init();

  /*if (imu.communication) {
    Serial.print("Valid communication with IMU!\n\n");
  } else {
    Serial.print("Invalid communicaiton with IMU...\n\n");
  }
  */

  /***
   * Unit tests for the Quaternion class
   *
   * These functions would be helpful for debugging your implementation.
   */
  Serial.println("Testing Quaternion class...");
  Serial.println();
  Quaternion q = Quaternion(2.3, 1.2, 2.1, 3.0);

  /* length() */
  double l = q.length();
  Serial.println("Expected length: 4.487761");
  Serial.printf("Your result: %f\n\n", l);

  /* normalize() */
  q.normalize();
  Serial.println("Expected normalized quaternion:");
  Serial.println("[0.512505 0.267394 0.467939 0.668485]");
  Serial.println("Your result: ");
  q.serialPrint();
  Serial.println();

  /* inverse() */
  Quaternion p = Quaternion(3.2, 3.3, 5.2, 0.1);
  p.inverse();
  Serial.println("Expected inverse quaternion:");
  Serial.println("[0.066418 -0.068493 -0.107929 -0.002076]");
  Serial.println("Your result: ");
  p.serialPrint();
  Serial.println();

  /* setFromAngleAxis() */
  Quaternion q0 = Quaternion().setFromAngleAxis(
    2, 1 / sqrt(14), 2 / sqrt(14), 3 / sqrt(14));
  Serial.println("Expected constructed quaternion:");
  Serial.println("[0.999848 0.004664 0.009329 0.013993]");
  Serial.println("Your result: ");
  q0.serialPrint();
  Serial.println();

  /* multiply() */
  Quaternion q1   = Quaternion(0.512505, 0.267394, 0.467939, 0.668485);
  Quaternion q2   = Quaternion(0.461017, -0.475423, -0.749152, -0.014407);
  Quaternion q1q2 = Quaternion().multiply(q1, q2);
  Serial.println("Expected multiplied quaternion:");
  Serial.println("[0.723587 0.373672 -0.482177 0.322949]");
  Serial.println("Your result: ");
  q1q2.serialPrint();
  Serial.println();

  /* rotate() */
  Quaternion q3 = Quaternion(0.512505, 0.267394, 0.467939, 0.668485);
  Quaternion q4 = Quaternion(0.461017, -0.475423, -0.749152, -0.014407);
  Quaternion q5 = q3.rotate(q4);
  Serial.println("Expected rotated quaternion:");
  Serial.println("[0.512505 -0.145908 0.750596 -0.390712]");
  Serial.println("Your result: ");
  q5.serialPrint();
  Serial.println();


  /* Measure bias */
  if (findBias) measureBias();
  delay(1000);
}
static double old_time = 0;
/* Main loop, read and display data */

void loop() {
  /* Reset the estimation if there is a keyboard input. */
  if (Serial.available()) {
    streamingMode = Serial.parseInt();




    gyrIntX = 0;
    gyrIntY = 0;
    gyrIntZ = 0;

    eulerCmp = Euler();

    qCmp = Quaternion();
		while(Serial.available()) {
			Serial.read();
		}
  }

  /* Get current time in milliseconds */
  double current_time = millis();
  double time_delta = current_time - old_time;
  old_time = current_time;

  /* Read IMU data! */
  imu.read();

  gyrIntX = gyrIntX + imu.gyrX * time_delta / 1000;
  gyrIntY = gyrIntY + imu.gyrY * time_delta / 1000;
  gyrIntZ = gyrIntZ + imu.gyrZ * time_delta / 1000;

	double gyrXCorrected = imu.gyrX - gyrBiasX;
  double gyrYCorrected = imu.gyrY - gyrBiasY;
	double gyrZCorrected = imu.gyrZ - gyrBiasZ;


	// alpha constant
	double alpha = .5;

	/* Use Euler angle to compute the angle  */
  if (streamingMode == EULER) {
    /***
     * TODO
     *
     * Implment the estimation of the Euler angle based on complementary filter!
     */
		eulerCmp.pitch = alpha * (eulerCmp.pitch + imu.gyrX * time_delta/1000) +
										 (1-alpha) * (-atan2(imu.accZ, sign(imu.accY) * sqrt(sq(imu.accX) + sq(imu.accY))) * 180 / PI);
		eulerCmp.yaw = gyrIntY;
		eulerCmp.roll = alpha * (eulerCmp.roll + imu.gyrZ * time_delta/1000) +
										(1-alpha) * (-atan2(-imu.accX, imu.accY) * 180 / PI);
  }

  /* Use quaternion to comptue the angle */
  else if (streamingMode == QUATERNION) {
    double a = .95;
    double length = sqrt(sq(gyrXCorrected) + sq(gyrYCorrected) + sq(gyrZCorrected)); // degrees
    Quaternion qdel;
    if (length == 0)
    {
      Serial.println("WHATTTTTTTTTTTT");
      qdel = Quaternion();
    }
    else
    {
      qdel = Quaternion().setFromAngleAxis((time_delta/1000 * length   /**(180/PI)*/), gyrXCorrected/length, gyrYCorrected/length, gyrZCorrected/length);
      // qdel.normalize();
      Quaternion qGyro = qdel.multiply(qCmp, qdel);
      qGyro.normalize();

			Quaternion qAlpha = Quaternion(0, imu.accX, imu.accY, imu.accZ);
      qAlpha.normalize();
			Quaternion qRotated = qAlpha.rotate(qCmp);
			Quaternion qRotNorm = qRotated.normalize();
			double angle = acos(qRotNorm.q[2]) * (180/PI);
			Quaternion axis = Quaternion(0, -qRotNorm.q[3]/sqrt(sq(qRotNorm.q[1]) + sq(qRotNorm.q[3])), 0, qRotNorm.q[1]/sqrt(sq(qRotNorm.q[1]) + sq(qRotNorm.q[3]))).normalize();
			Quaternion qTiltCorrect = Quaternion().setFromAngleAxis(angle * (1-a), axis.q[1], axis.q[2], axis.q[3]);
			qCmp = Quaternion().multiply(qTiltCorrect, qGyro);
      qCmp.normalize();

    }
  }

  streamData();
}
