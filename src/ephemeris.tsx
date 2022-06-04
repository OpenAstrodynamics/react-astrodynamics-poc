import { evalpoly } from "./math";

const eps = 0.40909280422232897;

export const semiMajor = (body: string, t: number) => {
  switch (body) {
    case "mercury":
      return 0.3870983098;
    case "venus":
      return 0.72332982;
    case "earth_barycenter":
      return 1.0000010178;
    case "mars":
      return evalpoly(t, [0.0934006477, 0.0009048438, -80641e-10]);
    case "jupiter":
      return evalpoly(t, [5.2026032092, 19132e-10, -39e-10]);
    case "saturn":
      return evalpoly(t, [9.5549091915, -0.0000213896, 444e-10]);
    case "uranus":
      return evalpoly(t, [19.2184460618, -3716e-10, 979e-10]);
    case "neptune":
      return evalpoly(t, [30.1103868694, -16635e-10, 686e-10]);
  }
};
