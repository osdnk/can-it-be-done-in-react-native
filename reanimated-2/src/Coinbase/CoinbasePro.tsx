import React from "react";
import { StyleSheet, View } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import { clamp } from "../components/AnimatedHelpers";

import Chart from "./Chart";
import Values from "./Values";
import Line from "./Line";
import Label from "./Label";
import Content from "./Content";
import Header from "./Header";
import { SIZE, STEP } from "./ChartHelpers";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
});

const Coinbase = () => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const onGestureEvent = useAnimatedGestureHandler({
    onActive: ({ x, y }) => {
      opacity.value = 1;
      translateY.value = clamp(y, 0, SIZE);
      translateX.value = x - (x % STEP) + STEP / 2;
    },
    onEnd: () => {
      opacity.value = 0;
    },
  });
  const horizontal = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  const vertical = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));
  return (
    <View style={styles.container}>
      <View>
        <Header />
        <View pointerEvents="none">
          <Values {...{ translateX }} />
        </View>
      </View>
      <View>
        <Chart />
      </View>
      <Content />
    </View>
  );
};

export default Coinbase;
