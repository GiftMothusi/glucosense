import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Colors, Spacing, Shadows } from '../theme/theme';
import { useAuthStore } from '../store/authStore';
import { getAccessToken } from '../services/api';

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
    {name === 'Dashboard' ? '🏠' :
     name === 'Log' ? '➕' :
     name === 'Insights' ? '📊' :
     name === 'Care' ? '🩺' : '👤'}
  </Text>
);

const LoginScreen = React.lazy(() => import('../screens/auth/LoginScreen'));
const RegisterScreen = React.lazy(() => import('../screens/auth/RegisterScreen'));
const OnboardingScreen = React.lazy(() => import('../screens/auth/OnboardingScreen'));

const DashboardScreen = React.lazy(() => import('../screens/dashboard/DashboardScreen'));
const LogGlucoseScreen = React.lazy(() => import('../screens/log/LogGlucoseScreen'));
const LogMealScreen = React.lazy(() => import('../screens/log/LogMealScreen'));
const LogInsulinScreen = React.lazy(() => import('../screens/log/LogInsulinScreen'));
const LogActivityScreen = React.lazy(() => import('../screens/log/LogActivityScreen'));
const LogHubScreen = React.lazy(() => import('../screens/log/LogHubScreen'));
const InsightsScreen = React.lazy(() => import('../screens/insights/InsightsScreen'));
const CareScreen = React.lazy(() => import('../screens/care/CareScreen'));
const ProfileScreen = React.lazy(() => import('../screens/profile/ProfileScreen'));

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Log: undefined;
  Insights: undefined;
  Care: undefined;
  Profile: undefined;
};

export type LogStackParamList = {
  LogHub: undefined;
  LogGlucose: { mealId?: number };
  LogMeal: undefined;
  LogInsulin: { mealId?: number };
  LogActivity: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const LogStack = createNativeStackNavigator<LogStackParamList>();

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen as any} />
    <AuthStack.Screen name="Register" component={RegisterScreen as any} />
  </AuthStack.Navigator>
);

const LogNavigator = () => (
  <LogStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.textPrimary,
      headerShadowVisible: false,
    }}
  >
    <LogStack.Screen name="LogHub" component={LogHubScreen as any} options={{ title: 'Log' }} />
    <LogStack.Screen name="LogGlucose" component={LogGlucoseScreen as any} options={{ title: 'Log Glucose' }} />
    <LogStack.Screen name="LogMeal" component={LogMealScreen as any} options={{ title: 'Log Meal' }} />
    <LogStack.Screen name="LogInsulin" component={LogInsulinScreen as any} options={{ title: 'Log Insulin' }} />
    <LogStack.Screen name="LogActivity" component={LogActivityScreen as any} options={{ title: 'Log Activity' }} />
  </LogStack.Navigator>
);

const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.surfaceBorder,
        borderTopWidth: 1,
        paddingBottom: Spacing.sm,
        paddingTop: Spacing.xs,
        height: 65,
        ...Shadows.sm,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen as any} />
    <Tab.Screen name="Log" component={LogNavigator} />
    <Tab.Screen name="Insights" component={InsightsScreen as any} />
    <Tab.Screen name="Care" component={CareScreen as any} />
    <Tab.Screen name="Profile" component={ProfileScreen as any} />
  </Tab.Navigator>
);

const SuspenseFallback = () => (
  <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
    <Image
      source={require('../../assets/glucosense_logo.png')}
      style={{ width: 200, height: 200, marginBottom: Spacing.xl }}
      resizeMode="contain"
    />
    <ActivityIndicator color={Colors.accent} size="large" />
  </View>
);

export const AppNavigator = () => {
  const { isAuthenticated, loadUser, user } = useAuthStore();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = await getAccessToken();
      if (token) {
        await loadUser();
      }
      setIsBootstrapping(false);
    };
    bootstrap();
  }, []);

  if (isBootstrapping) {
    return <SuspenseFallback />;
  }

  const needsOnboarding = isAuthenticated && user && !user.profile?.onboarding_completed;

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: Colors.primary,
          background: Colors.background,
          card: Colors.surface,
          text: Colors.textPrimary,
          border: Colors.surfaceBorder,
          notification: Colors.error,
        },
      }}
    >
      <React.Suspense fallback={<SuspenseFallback />}>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <RootStack.Screen name="Auth" component={AuthNavigator} />
          ) : needsOnboarding ? (
            <RootStack.Screen name="Onboarding" component={OnboardingScreen as any} />
          ) : (
            <RootStack.Screen name="Main" component={MainNavigator} />
          )}
        </RootStack.Navigator>
      </React.Suspense>
    </NavigationContainer>
  );
};
