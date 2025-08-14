import React, { useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'
import Colors from '@/data/Colors'

export default function EventCardSkeleton() {
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

  const SkeletonLine = ({
    width,
    height,
    marginBottom = 8,
    borderRadius = 4,
  }: {
    width: string | number
    height: number
    marginBottom?: number
    borderRadius?: number
  }) => (
    <Animated.View
      style={{
        height,
        backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
        borderRadius,
        marginBottom,
        width: width as any, // Cast to fix TypeScript issue
        opacity: animatedOpacity,
      }}
    />
  )

  return (
    <View
      style={{
        padding: 20,
        margin: 10,
        marginHorizontal: 20,
        backgroundColor: Colors.WHITE,
        borderRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      }}
    >
      {/* Banner Image Skeleton */}
      <Animated.View
        style={{
          width: '100%',
          height: 150,
          borderRadius: 15,
          backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
          marginBottom: 15,
          opacity: animatedOpacity,
        }}
      />

      {/* Title Skeleton */}
      <SkeletonLine width="85%" height={18} marginBottom={5} />

      {/* Created By Skeleton */}
      <SkeletonLine width="60%" height={14} marginBottom={10} />

      {/* Location Skeleton */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            marginRight: 8,
            opacity: animatedOpacity,
          }}
        />
        <SkeletonLine width="70%" height={14} marginBottom={0} />
      </View>

      {/* Date/Time Skeleton */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            marginRight: 8,
            opacity: animatedOpacity,
          }}
        />
        <SkeletonLine width="55%" height={14} marginBottom={0} />
      </View>

      {/* Registration Count Skeleton */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
      >
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            marginRight: 8,
            opacity: animatedOpacity,
          }}
        />
        <SkeletonLine width="45%" height={14} marginBottom={0} />
      </View>

      {/* Interest Count Skeleton */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}
      >
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            marginRight: 8,
            opacity: animatedOpacity,
          }}
        />
        <SkeletonLine width="50%" height={14} marginBottom={0} />
      </View>

      {/* Buttons Skeleton */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Share Button Skeleton */}
        <Animated.View
          style={{
            flex: 1,
            height: 45,
            borderRadius: 10,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            opacity: animatedOpacity,
          }}
        />

        {/* Interest Button Skeleton */}
        <Animated.View
          style={{
            flex: 1,
            height: 45,
            borderRadius: 10,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            opacity: animatedOpacity,
          }}
        />

        {/* Register Button Skeleton */}
        <Animated.View
          style={{
            flex: 1,
            height: 45,
            borderRadius: 10,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            opacity: animatedOpacity,
          }}
        />
      </View>
    </View>
  )
}
