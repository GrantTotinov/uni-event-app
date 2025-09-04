import React, { useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  ImageBackground,
} from 'react-native'
import { Surface, Button, useTheme, Avatar, Card } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

import { useAppTheme } from '@/context/ThemeContext'
import Colors from '@/data/Colors'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

// Memoized component following performance guidelines
const LandingScreen = React.memo(function LandingScreen() {
  const router = useRouter()
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()

  // Memoized navigation handlers following performance guidelines
  const navigateToSignUp = useCallback(() => {
    router.push('/(auth)/SignUp')
  }, [router])

  const navigateToSignIn = useCallback(() => {
    router.push('/(auth)/SignIn')
  }, [router])

  return (
    <Surface style={styles.container}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent
      />

      {/* Hero Section with Background Image - Reduced height */}
      <View style={styles.heroSection}>
        <ImageBackground
          source={require('../assets/images/login2.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
          />

          {/* Logo/Brand - Smaller and repositioned */}
          <View style={styles.logoContainer}>
            <Avatar.Icon
              size={60}
              icon="school"
              style={[styles.logo, { backgroundColor: theme.colors.primary }]}
            />
          </View>

          {/* Main Title - Compact version */}
          <View style={styles.titleContainer}>
            <Text style={styles.welcomeText}>Добре дошли в</Text>
            <Text style={[styles.brandTitle, { color: theme.colors.primary }]}>
              AcademiX
            </Text>
          </View>
        </ImageBackground>
      </View>

      {/* Content Section - Optimized spacing */}
      <Surface
        style={[
          styles.contentSection,
          { backgroundColor: theme.colors.surface },
        ]}
        elevation={4}
      >
        {/* Description - Compact */}
        <View style={styles.descriptionContainer}>
          <Text
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Университетската ви социална мрежа
          </Text>
          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Всички новини и събития на едно място.
          </Text>
        </View>

        {/* Quick Stats - Compact version */}
        <Card
          mode="outlined"
          style={[styles.statsCard, { borderColor: theme.colors.outline }]}
        >
          <Card.Content style={styles.statsCardContent}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Avatar.Icon
                  size={24}
                  icon="account-group"
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                />
                <Text
                  style={[styles.statNumber, { color: theme.colors.primary }]}
                >
                  500+
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Студенти
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Avatar.Icon
                  size={24}
                  icon="calendar-multiselect"
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                />
                <Text
                  style={[styles.statNumber, { color: theme.colors.secondary }]}
                >
                  100+
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Събития{' '}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Avatar.Icon
                  size={24}
                  icon="account-multiple"
                  style={{ backgroundColor: theme.colors.tertiaryContainer }}
                />
                <Text
                  style={[styles.statNumber, { color: theme.colors.tertiary }]}
                >
                  25+
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Клубове
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons - Compact Design */}
        <View style={styles.actionContainer}>
          {/* Primary CTA Button - Sign Up */}
          <Button
            mode="contained"
            onPress={navigateToSignUp}
            icon="account-plus"
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                elevation: 4,
              },
            ]}
            labelStyle={[
              styles.primaryButtonText,
              { color: theme.colors.onPrimary },
            ]}
            contentStyle={styles.primaryButtonContent}
          >
            Започни сега
          </Button>

          {/* Secondary Button - Sign In */}
          <Button
            mode="outlined"
            onPress={navigateToSignIn}
            icon="login"
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.colors.primary,
                borderWidth: 1.5,
              },
            ]}
            labelStyle={[
              styles.secondaryButtonText,
              { color: theme.colors.primary },
            ]}
            contentStyle={styles.secondaryButtonContent}
          >
            Вече имам акаунт
          </Button>
        </View>

        {/* Footer - Compact */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            © 2024 AcademiX
          </Text>
        </View>
      </Surface>
    </Surface>
  )
})

// Optimized styles following performance guidelines
const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: screenHeight,
  },
  // Reduced hero section height to 45%
  heroSection: {
    height: screenHeight * 0.45,
    position: 'relative',
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Repositioned and smaller logo
  logoContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logo: {
    // Logo styles
  },
  // Compact title container
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  // Reduced font sizes
  welcomeText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    fontWeight: '300',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  brandTitle: {
    fontSize: 32,
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Optimized content section spacing
  contentSection: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -15,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  // Compact description
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  // Compact stats card
  statsCard: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsCardContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  // Smaller stat numbers
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: Colors.GRAY,
    opacity: 0.3,
  },
  // Compact action container
  actionContainer: {
    gap: 12,
    marginBottom: 16,
  },
  // Compact primary button
  primaryButton: {
    borderRadius: 16,
  },
  primaryButtonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  // Compact secondary button
  secondaryButton: {
    borderRadius: 12,
  },
  secondaryButtonContent: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // Compact footer
  footer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.6,
  },
})

export default LandingScreen
