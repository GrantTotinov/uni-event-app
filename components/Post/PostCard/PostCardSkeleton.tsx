import React, { useEffect, useRef } from 'react'
import { View, Animated, Easing } from 'react-native'
import Colors from '@/data/Colors'

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
        width: width as any,
        opacity: animatedOpacity,
      }}
    />
  )

  return (
    <View
      style={{
        padding: 15,
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
      {/* Post Header Skeleton */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        {/* Profile Image Skeleton */}
        <Animated.View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            marginRight: 10,
            opacity: animatedOpacity,
          }}
        />
        <View style={{ flex: 1 }}>
          {/* Name Skeleton */}
          <SkeletonLine width="60%" height={16} marginBottom={4} />
          {/* Date Skeleton */}
          <SkeletonLine width="40%" height={12} marginBottom={0} />
        </View>
        {/* Menu Icon Skeleton */}
        <Animated.View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            opacity: animatedOpacity,
          }}
        />
      </View>

      {/* UHT Badge Skeleton (sometimes) */}
      <Animated.View
        style={{
          width: '50%',
          height: 20,
          borderRadius: 10,
          backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
          marginBottom: 8,
          opacity: animatedOpacity,
        }}
      />

      {/* Content Text Skeleton */}
      <SkeletonLine width="100%" height={16} marginBottom={4} />
      <SkeletonLine width="85%" height={16} marginBottom={4} />
      <SkeletonLine width="70%" height={16} marginBottom={12} />

      {/* Image Skeleton */}
      <Animated.View
        style={{
          width: '100%',
          height: 200,
          borderRadius: 10,
          backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
          marginBottom: 15,
          opacity: animatedOpacity,
        }}
      />

      {/* Actions Row Skeleton */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Like Button Skeleton */}
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
          <SkeletonLine width={30} height={16} marginBottom={0} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Comment Button Skeleton */}
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
          <SkeletonLine width={30} height={16} marginBottom={0} />
        </View>
      </View>

      {/* Comments Link Skeleton */}
      <SkeletonLine width="40%" height={14} marginBottom={8} />

      {/* Comment Input Skeleton */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: Colors.LIGHT_GRAY || '#E0E0E0',
          borderRadius: 8,
          padding: 10,
        }}
      >
        <SkeletonLine width="80%" height={16} marginBottom={0} />
        <Animated.View
          style={{
            width: 60,
            height: 30,
            borderRadius: 5,
            backgroundColor: Colors.LIGHT_GRAY || '#E0E0E0',
            marginLeft: 10,
            opacity: animatedOpacity,
          }}
        />
      </View>
    </View>
  )
}
