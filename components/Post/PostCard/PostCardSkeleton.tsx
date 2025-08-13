import React, { useEffect, useRef } from "react"
import { View, Animated, Easing } from "react-native"
import Colors from "@/data/Colors"

export default function PostCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    )

    shimmer.start()

    return () => shimmer.stop()
  }, [shimmerAnim])

  const animatedOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  })

  const SkeletonLine = ({ width, height, marginBottom }: any) => (
    <Animated.View
      style={{
        height: height || 16,
        backgroundColor: Colors.LIGHT_GRAY || "#E0E0E0",
        borderRadius: 4,
        marginBottom: marginBottom || 8,
        width: width || "100%",
        opacity: animatedOpacity,
      }}
    />
  )

  return (
    <View
      style={{
        backgroundColor: Colors.WHITE,
        borderRadius: 5,
        marginTop: 10,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Header skeleton */}
      <View
        style={{ flexDirection: "row", marginBottom: 15, alignItems: "center" }}
      >
        <Animated.View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.LIGHT_GRAY || "#E0E0E0",
            opacity: animatedOpacity,
          }}
        />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <SkeletonLine width="60%" height={14} marginBottom={6} />
          <SkeletonLine width="40%" height={12} marginBottom={0} />
        </View>
      </View>

      {/* Content skeleton */}
      <SkeletonLine width="100%" height={14} />
      <SkeletonLine width="85%" height={14} />
      <SkeletonLine width="70%" height={14} marginBottom={15} />

      {/* Image skeleton */}
      <Animated.View
        style={{
          width: "100%",
          height: 200,
          backgroundColor: Colors.LIGHT_GRAY || "#E0E0E0",
          borderRadius: 8,
          marginBottom: 15,
          opacity: animatedOpacity,
        }}
      />

      {/* Actions skeleton */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", gap: 20 }}>
          {/* Like button skeleton */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Animated.View
              style={{
                width: 24,
                height: 24,
                backgroundColor: Colors.LIGHT_GRAY || "#E0E0E0",
                borderRadius: 12,
                opacity: animatedOpacity,
              }}
            />
            <SkeletonLine width={20} height={14} marginBottom={0} />
          </View>

          {/* Comment button skeleton */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Animated.View
              style={{
                width: 24,
                height: 24,
                backgroundColor: Colors.LIGHT_GRAY || "#E0E0E0",
                borderRadius: 12,
                opacity: animatedOpacity,
              }}
            />
            <SkeletonLine width={20} height={14} marginBottom={0} />
          </View>
        </View>
      </View>
    </View>
  )
}
