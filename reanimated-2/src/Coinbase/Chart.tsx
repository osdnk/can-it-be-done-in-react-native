import React, { useEffect } from "react";
import { Svg, Path } from "react-native-svg";
import Animated, {
  useDerivedValue,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Text, Button } from "react-native";

import { SIZE } from "./ChartHelpers";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const factors = [];
for (let i = 0; i < 200; i++) {
  factors.push(Math.random() * 0.1 - 0.05);
}

function Chart() {
  const progress = useSharedValue(0);
  useEffect(() => {
    const interval = setInterval(() => {
      progress.value = withSpring(Math.random());
    }, 500);
    return () => clearInterval(interval);
  }, [progress]);

  const path = useDerivedValue(() => {
    const arr = ["M 0 0 "];
    for (let i = 1; i <= 200; i++) {
      arr.push(`L ${i} ${i + progress.value * factors[i - 1] * 600} `);
    }
    return arr.join("");
    // return `M10 ${progress.value * 300} L90 ${65 + progress.value * 100} L100 ${
    //   200 - progress.value * 180
    // } L130 ${10 + progress.value * 60} L200 120`;
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
      <Svg width={SIZE} height={SIZE} viewBox="0 0 220 220">
        <AnimatedPath fill="none" stroke="red" animatedProps={animatedStyle} />
      </Svg>
    </>
  );
}

export default Chart;
