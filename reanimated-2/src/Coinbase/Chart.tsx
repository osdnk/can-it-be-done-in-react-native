import React, { useEffect } from "react";
import { Svg, Path } from "react-native-svg";
import Animated, {
  useDerivedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { SIZE } from "./ChartHelpers";
// @ts-ignore
import { data1, data2 } from "./data.tsx";
import { Text, TouchableOpacity } from "react-native";

class MonotonicCubicSpline {
  constructor(x, y) {
    var alpha,
      beta,
      delta,
      dist,
      i,
      m,
      n,
      tau,
      to_fix,
      _i,
      _j,
      _len,
      _len2,
      _ref,
      _ref2,
      _ref3,
      _ref4;

    n = x.length;
    delta = [];
    m = [];
    alpha = [];
    beta = [];
    dist = [];
    tau = [];

    for (
      i = 0, _ref = n - 1;
      _ref >= 0 ? i < _ref : i > _ref;
      _ref >= 0 ? (i += 1) : (i -= 1)
    ) {
      delta[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
      if (i > 0) {
        m[i] = (delta[i - 1] + delta[i]) / 2;
      }
    }

    m[0] = delta[0];
    m[n - 1] = delta[n - 2];
    to_fix = [];

    for (
      i = 0, _ref2 = n - 1;
      _ref2 >= 0 ? i < _ref2 : i > _ref2;
      _ref2 >= 0 ? (i += 1) : (i -= 1)
    ) {
      if (delta[i] === 0) {
        to_fix.push(i);
      }
    }

    for (_i = 0, _len = to_fix.length; _i < _len; _i++) {
      i = to_fix[_i];
      m[i] = m[i + 1] = 0;
    }

    for (
      i = 0, _ref3 = n - 1;
      _ref3 >= 0 ? i < _ref3 : i > _ref3;
      _ref3 >= 0 ? (i += 1) : (i -= 1)
    ) {
      alpha[i] = m[i] / delta[i];
      beta[i] = m[i + 1] / delta[i];
      dist[i] = Math.pow(alpha[i], 2) + Math.pow(beta[i], 2);
      tau[i] = 3 / Math.sqrt(dist[i]);
    }

    to_fix = [];

    for (
      i = 0, _ref4 = n - 1;
      _ref4 >= 0 ? i < _ref4 : i > _ref4;
      _ref4 >= 0 ? (i += 1) : (i -= 1)
    ) {
      if (dist[i] > 9) {
        to_fix.push(i);
      }
    }

    for (_j = 0, _len2 = to_fix.length; _j < _len2; _j++) {
      i = to_fix[_j];
      m[i] = tau[i] * alpha[i] * delta[i];
      m[i + 1] = tau[i] * beta[i] * delta[i];
    }

    this.x = x.slice(0, n);
    this.y = y.slice(0, n);
    this.m = m;
  }

  interpolate(x) {
    var h, h00, h01, h10, h11, i, t, t2, t3, y, _ref;

    for (
      i = _ref = this.x.length - 2;
      _ref <= 0 ? i <= 0 : i >= 0;
      _ref <= 0 ? (i += 1) : (i -= 1)
    ) {
      if (this.x[i] <= x) {
        break;
      }
    }

    h = this.x[i + 1] - this.x[i];
    t = (x - this.x[i]) / h;
    t2 = Math.pow(t, 2);
    t3 = Math.pow(t, 3);
    h00 = 2 * t3 - 3 * t2 + 1;
    h10 = t3 - 2 * t2 + t;
    h01 = -2 * t3 + 3 * t2;
    h11 = t3 - t2;
    y =
      h00 * this.y[i] +
      h10 * h * this.m[i] +
      h01 * this.y[i + 1] +
      h11 * h * this.m[i + 1];

    return y;
  }
}

//const sp = new MonotonicCubicSpline(data[0], data[1]);
//console.warn(sp.interpolate(1.5));

const AnimatedPath = Animated.createAnimatedComponent(Path);

const factors: number[] = [];
for (let i = 0; i < 200; i++) {
  factors.push(Math.random() * 0.1 - 0.05);
}

const parse = (data) => {
  let smallestY = data[0][1];
  let biggestY = data[0][1];
  for (const d of data) {
    smallestY = Math.min(smallestY, d[1]);
    biggestY = Math.max(biggestY, d[1]);
  }
  const smallestX = data[0][0];
  const biggestX = data[data.length - 1][0];
  return data.map(([x, y]) => ({
    x: (x - smallestX) / (biggestX - smallestX),
    y: 1 - (y - smallestY) / (biggestY - smallestY),
  }));
};

const dataParsed = parse(data1);
const dataParsed2 = parse(data2.slice(0, 150));

function simplifyData(data) {
  const denseDataParsed = data.filter((_, i) => i % 10 === 0);
  const { denseX, denseY } = denseDataParsed.reduce(
    (acc, curr) => {
      acc.denseX.push(curr.x);
      acc.denseY.push(curr.y);
      return acc;
    },
    {
      denseX: [],
      denseY: [],
    }
  );

  const softData = [];
  const ms = new MonotonicCubicSpline(denseX, denseY);
  for (let d of dataParsed) {
    softData.push({ x: d.x, y: ms.interpolate(d.x) });
  }
  return softData;
}

const softData = simplifyData(dataParsed);

function Chart() {
  console.warn(dataParsed.length, dataParsed2.length);
  const progress = useSharedValue(0);
  const sharedPoints = useSharedValue([]);
  const nextSharedPoints = useSharedValue([]);
  useEffect(() => {
    sharedPoints.value = softData;
    nextSharedPoints.value = softData;
  }, [nextSharedPoints, sharedPoints]);
  const path = useDerivedValue(() => {
    let fromValue = sharedPoints.value;
    let toValue = nextSharedPoints.value;
    if (progress.value !== 1) {
      const numOfPoints = Math.round(
        fromValue.length +
          (toValue.length - fromValue.length) *
            Math.min(progress.value, 0.5) *
            2
      );
      if (fromValue.length !== numOfPoints) {
        const mappedFrom = [];
        const coef = (fromValue.length - 1) / (numOfPoints - 1);
        for (let i = 0; i < numOfPoints; i++) {
          mappedFrom.push(fromValue[Math.round(i * coef)]);
        }
        fromValue = mappedFrom;
      }

      if (toValue.length !== numOfPoints) {
        const mappedTo = [];
        const coef = (toValue.length - 1) / (numOfPoints - 1);

        for (let i = 0; i < numOfPoints; i++) {
          mappedTo.push(toValue[Math.round(i * coef)]);
        }
        toValue = mappedTo;
      }
      return fromValue
        .map(({ x, y }, i) => {
          const { x: nX, y: nY } = toValue[i];
          const mX = x + (nX - x) * progress.value;
          const mY = y + (nY - y) * progress.value;
          return `L ${mX} ${mY}`;
        })
        .join(" ")
        .replace("L", "M");
    }

    return toValue
      .map(({ x, y }) => {
        return `L ${x} ${y}`;
      })
      .join(" ")
      .replace("L", "M");
  });

  // @ts-ignore
  const animatedStyle = useAnimatedStyle(() => {
    return {
      d: path.value,
      //stroke: progress.value < 0.5 ? "#4AFA9A" : "#E33F64",
    };
  });
  return (
    <>
      <Svg width={SIZE} height={SIZE} viewBox="0 0 1 1">
        <AnimatedPath
          fill="none"
          stroke="red"
          strokeWidth="0.005"
          animatedProps={animatedStyle}
        />
      </Svg>
      <TouchableOpacity
        onPress={() => {
          sharedPoints.value = nextSharedPoints.value;
          nextSharedPoints.value = dataParsed;
          progress.value = 0;
          progress.value = withSpring(1);
        }}
      >
        <Text style={{ color: "white" }}>Data 1</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          sharedPoints.value = nextSharedPoints.value;
          nextSharedPoints.value = softData;
          progress.value = 0;
          progress.value = withSpring(1);
        }}
      >
        <Text style={{ color: "white" }}>Data 1 simplified</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          sharedPoints.value = nextSharedPoints.value;
          nextSharedPoints.value = dataParsed2;
          progress.value = 0;
          progress.value = withTiming(1);
        }}
      >
        <Text style={{ color: "white" }}>Data 2</Text>
      </TouchableOpacity>
    </>
  );
}

export default Chart;
