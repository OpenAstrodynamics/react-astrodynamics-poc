import { Vector3 } from "three";

const ERFA_DJ00 = 2451545.0;
const ERFA_DJM = 365250.0;
const ERFA_DAS2R = 4.848136811095359935899141e-6;
const pi = Math.PI;
const twopi = Math.PI * Math.PI;

/*
 **  - - - - - - - -
 **   e r a A n p m
 **  - - - - - - - -
 **
 **  Normalize angle into the range -pi <= a < +pi.
 **
 **  Given:
 **     a        double     angle (radians)
 **
 **  Returned (function value):
 **              double     angle in range +/-pi
 **
 **  This revision:  2021 May 11
 **
 **  Copyright (C) 2013-2021, NumFOCUS Foundation.
 **  Derived, with permission, from the SOFA library.  See notes at end of file.
 */
const eraAnpm = (a: number) => {
  let w = a % twopi;
  if (Math.abs(w) >= pi) w -= twopi * Math.sign(a);

  return w;

  /* Finished. */
};

/*
 **  - - - - - - - - - -
 **   e r a P l a n 9 4
 **  - - - - - - - - - -
 **
 **  Approximate heliocentric position and velocity of a nominated major
 **  planet:  Mercury, Venus, EMB, Mars, Jupiter, Saturn, Uranus or
 **  Neptune (but not the Earth itself).
 **
 **  n.b. Not IAU-endorsed and without canonical status.
 **
 **  Given:
 **     date1  double       TDB date part A (Note 1)
 **     date2  double       TDB date part B (Note 1)
 **     np     int          planet (1=Mercury, 2=Venus, 3=EMB, 4=Mars,
 **                             5=Jupiter, 6=Saturn, 7=Uranus, 8=Neptune)
 **
 **  Returned (argument):
 **     pv     double[2][3] planet p,v (heliocentric, J2000.0, au,au/d)
 **
 **  Returned (function value):
 **            int          status: -1 = illegal NP (outside 1-8)
 **                                  0 = OK
 **                                 +1 = warning: year outside 1000-3000
 **                                 +2 = warning: failed to converge
 **
 **  Notes:
 **
 **  1) The date date1+date2 is in the TDB time scale (in practice TT can
 **     be used) and is a Julian Date, apportioned in any convenient way
 **     between the two arguments.  For example, JD(TDB)=2450123.7 could
 **     be expressed in any of these ways, among others:
 **
 **            date1          date2
 **
 **         2450123.7           0.0       (JD method)
 **         2451545.0       -1421.3       (J2000 method)
 **         2400000.5       50123.2       (MJD method)
 **         2450123.5           0.2       (date & time method)
 **
 **     The JD method is the most natural and convenient to use in cases
 **     where the loss of several decimal digits of resolution is
 **     acceptable.  The J2000 method is best matched to the way the
 **     argument is handled internally and will deliver the optimum
 **     resolution.  The MJD method and the date & time methods are both
 **     good compromises between resolution and convenience.  The limited
 **     accuracy of the present algorithm is such that any of the methods
 **     is satisfactory.
 **
 **  2) If an np value outside the range 1-8 is supplied, an error status
 **     (function value -1) is returned and the pv vector set to zeroes.
 **
 **  3) For np=3 the result is for the Earth-Moon Barycenter.  To obtain
 **     the heliocentric position and velocity of the Earth, use instead
 **     the ERFA function eraEpv00.
 **
 **  4) On successful return, the array pv contains the following:
 **
 **        pv[0][0]   x      }
 **        pv[0][1]   y      } heliocentric position, au
 **        pv[0][2]   z      }
 **
 **        pv[1][0]   xdot   }
 **        pv[1][1]   ydot   } heliocentric velocity, au/d
 **        pv[1][2]   zdot   }
 **
 **     The reference frame is equatorial and is with respect to the
 **     mean equator and equinox of epoch J2000.0.
 **
 **  5) The algorithm is due to J.L. Simon, P. Bretagnon, J. Chapront,
 **     M. Chapront-Touze, G. Francou and J. Laskar (Bureau des
 **     Longitudes, Paris, France).  From comparisons with JPL
 **     ephemeris DE102, they quote the following maximum errors
 **     over the interval 1800-2050:
 **
 **                     L (arcsec)    B (arcsec)      R (km)
 **
 **        Mercury          4             1             300
 **        Venus            5             1             800
 **        EMB              6             1            1000
 **        Mars            17             1            7700
 **        Jupiter         71             5           76000
 **        Saturn          81            13          267000
 **        Uranus          86             7          712000
 **        Neptune         11             1          253000
 **
 **     Over the interval 1000-3000, they report that the accuracy is no
 **     worse than 1.5 times that over 1800-2050.  Outside 1000-3000 the
 **     accuracy declines.
 **
 **     Comparisons of the present function with the JPL DE200 ephemeris
 **     give the following RMS errors over the interval 1960-2025:
 **
 **                      position (km)     velocity (m/s)
 **
 **        Mercury            334               0.437
 **        Venus             1060               0.855
 **        EMB               2010               0.815
 **        Mars              7690               1.98
 **        Jupiter          71700               7.70
 **        Saturn          199000              19.4
 **        Uranus          564000              16.4
 **        Neptune         158000              14.4
 **
 **     Comparisons against DE200 over the interval 1800-2100 gave the
 **     following maximum absolute differences.  (The results using
 **     DE406 were essentially the same.)
 **
 **                   L (arcsec)   B (arcsec)     R (km)   Rdot (m/s)
 **
 **        Mercury        7            1            500       0.7
 **        Venus          7            1           1100       0.9
 **        EMB            9            1           1300       1.0
 **        Mars          26            1           9000       2.5
 **        Jupiter       78            6          82000       8.2
 **        Saturn        87           14         263000      24.6
 **        Uranus        86            7         661000      27.4
 **        Neptune       11            2         248000      21.4
 **
 **  6) The present ERFA re-implementation of the original Simon et al.
 **     Fortran code differs from the original in the following respects:
 **
 **       *  C instead of Fortran.
 **
 **       *  The date is supplied in two parts.
 **
 **       *  The result is returned only in equatorial Cartesian form;
 **          the ecliptic longitude, latitude and radius vector are not
 **          returned.
 **
 **       *  The result is in the J2000.0 equatorial frame, not ecliptic.
 **
 **       *  More is done in-line: there are fewer calls to subroutines.
 **
 **       *  Different error/warning status values are used.
 **
 **       *  A different Kepler's-equation-solver is used (avoiding
 **          use of double precision complex).
 **
 **       *  Polynomials in t are nested to minimize rounding errors.
 **
 **       *  Explicit double constants are used to avoid mixed-mode
 **          expressions.
 **
 **     None of the above changes affects the result significantly.
 **
 **  7) The returned status indicates the most serious condition
 **     encountered during execution of the function.  Illegal np is
 **     considered the most serious, overriding failure to converge,
 **     which in turn takes precedence over the remote date warning.
 **
 **  Called:
 **     eraAnpm      normalize angle into range +/- pi
 **
 **  Reference:  Simon, J.L, Bretagnon, P., Chapront, J.,
 **              Chapront-Touze, M., Francou, G., and Laskar, J.,
 **              Astron.Astrophys., 282, 663 (1994).
 **
 **  This revision:  2021 May 11
 **
 **  Copyright (C) 2013-2021, NumFOCUS Foundation.
 **  Derived, with permission, from the SOFA library.  See notes at end of file.
 */
export const eraPlan94 = (
  date1: number,
  date2: number,
  np: number
): [Vector3, Vector3] => {
  /* Gaussian constant */
  const GK = 0.01720209895;

  /* Sin and cos of J2000.0 mean obliquity (IAU 1976) */
  const SINEPS = 0.3977771559319137;
  const COSEPS = 0.9174820620691818;

  /* Maximum number of iterations allowed to solve Kepler's equation */
  const KMAX = 10;

  /* Planetary inverse masses */
  const amas = [
    6023600.0 /* Mercury */, 408523.5 /* Venus   */, 328900.5 /* EMB     */,
    3098710.0 /* Mars    */, 1047.355 /* Jupiter */, 3498.5 /* Saturn  */,
    22869.0 /* Uranus  */, 19314.0,
  ]; /* Neptune */

  /*
   ** Tables giving the mean Keplerian elements, limited to t^2 terms:
   **
   **   a       semi-major axis (au)
   **   dlm     mean longitude (degree and arcsecond)
   **   e       eccentricity
   **   pi      longitude of the perihelion (degree and arcsecond)
   **   dinc    inclination (degree and arcsecond)
   **   omega   longitude of the ascending node (degree and arcsecond)
   */

  const a = [
    [0.3870983098, 0.0, 0.0] /* Mercury */,
    [0.72332982, 0.0, 0.0] /* Venus   */,
    [1.0000010178, 0.0, 0.0] /* EMB     */,
    [1.5236793419, 3e-10, 0.0] /* Mars    */,
    [5.2026032092, 19132e-10, -39e-10] /* Jupiter */,
    [9.5549091915, -0.0000213896, 444e-10] /* Saturn  */,
    [19.2184460618, -3716e-10, 979e-10] /* Uranus  */,
    [30.1103868694, -16635e-10, 686e-10] /* Neptune */,
  ];

  const dlm = [
    [252.25090552, 5381016286.88982, -1.92789],
    [181.97980085, 2106641364.33548, 0.59381],
    [100.46645683, 1295977422.83429, -2.04411],
    [355.43299958, 689050774.93988, 0.94264],
    [34.35151874, 109256603.77991, -30.60378],
    [50.0774443, 43996098.55732, 75.61614],
    [314.05500511, 15424811.93933, -1.75083],
    [304.34866548, 7865503.20744, 0.21103],
  ];

  const e = [
    [0.2056317526, 0.0002040653, -28349e-10],
    [0.0067719164, -0.0004776521, 98127e-10],
    [0.0167086342, -0.0004203654, -0.0000126734],
    [0.0934006477, 0.0009048438, -80641e-10],
    [0.0484979255, 0.0016322542, -0.0000471366],
    [0.0555481426, -0.0034664062, -0.0000643639],
    [0.0463812221, -0.0002729293, 0.0000078913],
    [0.009455747, 0.0000603263, 0.0],
  ];

  const pi = [
    [77.45611904, 5719.1159, -4.83016],
    [131.563703, 175.4864, -498.48184],
    [102.93734808, 11612.3529, 53.27577],
    [336.06023395, 15980.45908, -62.328],
    [14.33120687, 7758.75163, 259.95938],
    [93.05723748, 20395.49439, 190.25952],
    [173.00529106, 3215.56238, -34.09288],
    [48.12027554, 1050.71912, 27.39717],
  ];

  const dinc = [
    [7.00498625, -214.25629, 0.28977],
    [3.39466189, -30.84437, -11.67836],
    [0.0, 469.97289, -3.35053],
    [1.84972648, -293.31722, -8.1183],
    [1.30326698, -71.5589, 11.95297],
    [2.48887878, 91.85195, -17.66225],
    [0.77319689, -60.72723, 1.25759],
    [1.76995259, 8.12333, 0.08135],
  ];

  const omega = [
    [48.33089304, -4515.21727, -31.79892],
    [76.67992019, -10008.48154, -51.32614],
    [174.87317577, -8679.27034, 15.34191],
    [49.55809321, -10620.90088, -230.57416],
    [100.46440702, 6362.03561, 326.52178],
    [113.66550252, -9240.19942, -66.23743],
    [74.00595701, 2669.15033, 145.93964],
    [131.78405702, -221.94322, -0.78728],
  ];

  /* Tables for trigonometric terms to be added to the mean elements of */
  /* the semi-major axes */

  const kp = [
    [69613, 75645, 88306, 59899, 15746, 71087, 142173, 3086, 0],
    [21863, 32794, 26934, 10931, 26250, 43725, 53867, 28939, 0],
    [16002, 21863, 32004, 10931, 14529, 16368, 15318, 32794, 0],
    [6345, 7818, 15636, 7077, 8184, 14163, 1107, 4872, 0],
    [1760, 1454, 1167, 880, 287, 2640, 19, 2047, 1454],
    [574, 0, 880, 287, 19, 1760, 1167, 306, 574],
    [204, 0, 177, 1265, 4, 385, 200, 208, 204],
    [0, 102, 106, 4, 98, 1367, 487, 204, 0],
  ];

  const ca = [
    [4, -13, 11, -9, -9, -3, -1, 4, 0],
    [-156, 59, -42, 6, 19, -20, -10, -12, 0],
    [64, -152, 62, -8, 32, -41, 19, -11, 0],
    [124, 621, -145, 208, 54, -57, 30, 15, 0],
    [-23437, -2634, 6601, 6259, -1507, -1821, 2620, -2115, -1489],
    [62911, -119919, 79336, 17814, -24241, 12068, 8306, -4893, 8902],
    [389061, -262125, -44088, 8387, -22976, -2093, -615, -9720, 6633],
    [-412235, -157046, -31430, 37817, -9740, -13, -7449, 9644, 0],
  ];

  const sa = [
    [-29, -1, 9, 6, -6, 5, 4, 0, 0],
    [-48, -125, -26, -37, 18, -13, -20, -2, 0],
    [-150, -46, 68, 54, 14, 24, -28, 22, 0],
    [-621, 532, -694, -20, 192, -94, 71, -73, 0],
    [-14614, -19828, -5869, 1881, -4372, -2255, 782, 930, 913],
    [139737, 0, 24667, 51123, -5102, 7429, -4095, -1976, -9566],
    [-138081, 0, 37205, -49039, -41901, -33872, -27037, -12474, 18797],
    [0, 28492, 133236, 69654, 52322, -49577, -26430, -3593, 0],
  ];

  /* Tables giving the trigonometric terms to be added to the mean */
  /* elements of the mean longitudes */

  const kq = [
    [3086, 15746, 69613, 59899, 75645, 88306, 12661, 2658, 0, 0],
    [21863, 32794, 10931, 73, 4387, 26934, 1473, 2157, 0, 0],
    [10, 16002, 21863, 10931, 1473, 32004, 4387, 73, 0, 0],
    [10, 6345, 7818, 1107, 15636, 7077, 8184, 532, 10, 0],
    [19, 1760, 1454, 287, 1167, 880, 574, 2640, 19, 1454],
    [19, 574, 287, 306, 1760, 12, 31, 38, 19, 574],
    [4, 204, 177, 8, 31, 200, 1265, 102, 4, 204],
    [4, 102, 106, 8, 98, 1367, 487, 204, 4, 102],
  ];

  const cl = [
    [21, -95, -157, 41, -5, 42, 23, 30, 0, 0],
    [-160, -313, -235, 60, -74, -76, -27, 34, 0, 0],
    [-325, -322, -79, 232, -52, 97, 55, -41, 0, 0],
    [2268, -979, 802, 602, -668, -33, 345, 201, -55, 0],
    [7610, -4997, -7689, -5841, -2617, 1115, -748, -607, 6074, 354],
    [-18549, 30125, 20012, -730, 824, 23, 1289, -352, -14767, -2062],
    [-135245, -14594, 4197, -4030, -5630, -2898, 2540, -306, 2939, 1986],
    [89948, 2103, 8963, 2695, 3682, 1648, 866, -154, -1963, -283],
  ];

  const sl = [
    [-342, 136, -23, 62, 66, -52, -33, 17, 0, 0],
    [524, -149, -35, 117, 151, 122, -71, -62, 0, 0],
    [-105, -137, 258, 35, -116, -88, -112, -80, 0, 0],
    [854, -205, -936, -240, 140, -341, -97, -232, 536, 0],
    [-56980, 8016, 1012, 1448, -3024, -3710, 318, 503, 3767, 577],
    [138606, -13478, -4964, 1441, -1319, -1482, 427, 1236, -9167, -1918],
    [71234, -41116, 5334, -4935, -1848, 66, 434, -1748, 3780, -701],
    [-47645, 11647, 2166, 3194, 679, 0, -244, -419, -2531, 48],
  ];

  /* ------------------------------------------------------------------ */
  let jstat;

  /* Validate the planet number. */
  /* Decrement the planet number to start at zero. */
  np--;

  /* Time: Julian millennia since J2000.0. */
  const t = (date1 - ERFA_DJ00 + date2) / ERFA_DJM;

  /* OK status unless remote date. */
  jstat = Math.abs(t) <= 1.0 ? 0 : 1;

  /* Compute the mean elements. */
  let da = a[np][0] + (a[np][1] + a[np][2] * t) * t;
  let dl =
    (3600.0 * dlm[np][0] + (dlm[np][1] + dlm[np][2] * t) * t) * ERFA_DAS2R;
  let de = e[np][0] + (e[np][1] + e[np][2] * t) * t;
  let dp = eraAnpm(
    (3600.0 * pi[np][0] + (pi[np][1] + pi[np][2] * t) * t) * ERFA_DAS2R
  );
  let di =
    (3600.0 * dinc[np][0] + (dinc[np][1] + dinc[np][2] * t) * t) * ERFA_DAS2R;
  let dom = eraAnpm(
    (3600.0 * omega[np][0] + (omega[np][1] + omega[np][2] * t) * t) * ERFA_DAS2R
  );

  /* Apply the trigonometric terms. */
  const dmu = 0.3595362 * t;
  for (let k = 0; k < 8; k++) {
    const arga = kp[np][k] * dmu;
    const argl = kq[np][k] * dmu;
    da += (ca[np][k] * Math.cos(arga) + sa[np][k] * Math.sin(arga)) * 1e-7;
    dl += (cl[np][k] * Math.cos(argl) + sl[np][k] * Math.sin(argl)) * 1e-7;
  }
  const arga = kp[np][8] * dmu;
  da += t * (ca[np][8] * Math.cos(arga) + sa[np][8] * Math.sin(arga)) * 1e-7;
  for (let k = 8; k < 10; k++) {
    const argl = kq[np][k] * dmu;
    dl += t * (cl[np][k] * Math.cos(argl) + sl[np][k] * Math.sin(argl)) * 1e-7;
  }
  dl = dl % twopi;

  /* Iterative soln. of Kepler's equation to get eccentric anomaly. */
  const am = dl - dp;
  let ae = am + de * Math.sin(am);
  let k = 0;
  let dae = 1.0;
  while (k < KMAX && Math.abs(dae) > 1e-12) {
    dae = (am - ae + de * Math.sin(ae)) / (1.0 - de * Math.cos(ae));
    ae += dae;
    k++;
    if (k === KMAX - 1) jstat = 2;
  }

  /* True anomaly. */
  const ae2 = ae / 2.0;
  const at =
    2.0 *
    Math.atan2(
      Math.sqrt((1.0 + de) / (1.0 - de)) * Math.sin(ae2),
      Math.cos(ae2)
    );

  /* Distance (au) and speed (radians per day). */
  const r = da * (1.0 - de * Math.cos(ae));
  const v = GK * Math.sqrt((1.0 + 1.0 / amas[np]) / (da * da * da));

  const si2 = Math.sin(di / 2.0);
  const xq = si2 * Math.cos(dom);
  const xp = si2 * Math.sin(dom);
  const tl = at + dp;
  const xsw = Math.sin(tl);
  const xcw = Math.cos(tl);
  const xm2 = 2.0 * (xp * xcw - xq * xsw);
  const xf = da / Math.sqrt(1 - de * de);
  const ci2 = Math.cos(di / 2.0);
  const xms = (de * Math.sin(dp) + xsw) * xf;
  const xmc = (de * Math.cos(dp) + xcw) * xf;
  const xpxq2 = 2 * xp * xq;

  /* Position (J2000.0 ecliptic x,y,z in au). */
  const x = r * (xcw - xm2 * xp);
  const y = r * (xsw + xm2 * xq);
  const z = r * (-xm2 * ci2);

  /* Rotate to equatorial. */
  // pv[0][0] = x;
  // pv[0][1] = y * COSEPS - z * SINEPS;
  // pv[0][2] = y * SINEPS + z * COSEPS;
  const position = new Vector3(
    x,
    y * COSEPS - z * SINEPS,
    y * SINEPS + z * COSEPS
  );

  /* Velocity (J2000.0 ecliptic xdot,ydot,zdot in au/d). */
  const vx = v * ((-1.0 + 2.0 * xp * xp) * xms + xpxq2 * xmc);
  const vy = v * ((1.0 - 2.0 * xq * xq) * xmc - xpxq2 * xms);
  const vz = v * (2.0 * ci2 * (xp * xms + xq * xmc));

  /* Rotate to equatorial. */
  // pv[1][0] = x;
  // pv[1][1] = y * COSEPS - z * SINEPS;
  // pv[1][2] = y * SINEPS + z * COSEPS;
  const velocity = new Vector3(
    vx,
    vy * COSEPS - vz * SINEPS,
    vy * SINEPS + vz * COSEPS
  );

  /* Return the status. */
  return [position, velocity];

  /* Finished. */
};
