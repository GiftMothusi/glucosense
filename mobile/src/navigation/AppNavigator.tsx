import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Shadows } from '../theme/theme';
import { useAuthStore } from '../store/authStore';
import { getAccessToken } from '../services/api';

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  let iconName: keyof typeof Ionicons.glyphMap;
  
  switch (name) {
    case 'Dashboard':
      iconName = 'home-outline';
      break;
    case 'Log':
      iconName = 'add-circle-outline';
      break;
    case 'Insights':
      iconName = 'bar-chart-outline';
      break;
    case 'Care':
      iconName = 'medkit-outline';
      break;
    case 'Profile':
    default:
      iconName = 'person-outline';
      break;
  }
  
  return <Ionicons name={iconName} size={24} color={focused ? Colors.primary : Colors.textMuted} />;
};

const LoginScreen = React.lazy(() => import('../screens/auth/LoginScreen'));
const RegisterScreen = React.lazy(() => import('../screens/auth/RegisterScreen'));
const OnboardingScreen = React.lazy(() => import('../screens/auth/OnboardingScreen'));

const DashboardScreen = React.lazy(() => import('../screens/dashboard/DashboardScreen'));
const GlucoseDashboardScreen = React.lazy(() => import('../screens/dashboard/GlucoseDashboardScreen'));
const MealsDashboardScreen = React.lazy(() => import('../screens/dashboard/MealsDashboardScreen'));
const InsulinDashboardScreen = React.lazy(() => import('../screens/dashboard/InsulinDashboardScreen'));
const ActivitiesDashboardScreen = React.lazy(() => import('../screens/dashboard/ActivitiesDashboardScreen'));
const LogGlucoseScreen = React.lazy(() => import('../screens/log/LogGlucoseScreen'));
const LogMealScreen = React.lazy(() => import('../screens/log/LogMealScreen'));
const LogInsulinScreen = React.lazy(() => import('../screens/log/LogInsulinScreen'));
const LogActivityScreen = React.lazy(() => import('../screens/log/LogActivityScreen'));
const LogHubScreen = React.lazy(() => import('../screens/log/LogHubScreen'));
const InsightsScreen = React.lazy(() => import('../screens/insights/InsightsScreen'));
const CareScreen = React.lazy(() => import('../screens/care/CareScreen'));

const ProfileScreen = React.lazy(() => import('../screens/profile/ProfileScreen'));
const PersonalInfoScreen       = React.lazy(() => import('../screens/profile/PersonalInfoScreen'));
const DiabetesProfileScreen    = React.lazy(() => import('../screens/profile/DiabetesProfileScreen'));
const GlucoseTargetsScreen     = React.lazy(() => import('../screens/profile/GlucoseTargetsScreen'));
const NotificationsScreen      = React.lazy(() => import('../screens/profile/NotificationsScreen'));
const PrivacySecurityScreen    = React.lazy(() => import('../screens/profile/PrivacySecurityScreen'));
const ExportDataScreen         = React.lazy(() => import('../screens/profile/ExportDataScreen'));
const HelpSupportScreen        = React.lazy(() => import('../screens/profile/HelpSupportScreen'));



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

export type DashboardStackParamList = {
  DashboardHome: undefined;
  GlucoseDashboard: undefined;
  MealsDashboard: undefined;
  InsulinDashboard: undefined;
  ActivitiesDashboard: undefined;
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  PersonalInfo: undefined;
  DiabetesProfile: undefined;
  GlucoseTargets: undefined;
  Notifications: undefined;
  PrivacySecurity: undefined;
  ExportData: undefined;
  HelpSupport: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const LogStack = createNativeStackNavigator<LogStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const ProfileStack   = createNativeStackNavigator<ProfileStackParamList>();


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

const DashboardNavigator = () => (
  <DashboardStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.textPrimary,
      headerShadowVisible: false,
    }}
  >
    <DashboardStack.Screen name="DashboardHome" component={DashboardScreen as any} options={{ title: 'Dashboard' }} />
    <DashboardStack.Screen name="GlucoseDashboard" component={GlucoseDashboardScreen as any} options={{ title: 'Glucose' }} />
    <DashboardStack.Screen name="MealsDashboard" component={MealsDashboardScreen as any} options={{ title: 'Meals' }} />
    <DashboardStack.Screen name="InsulinDashboard" component={InsulinDashboardScreen as any} options={{ title: 'Insulin' }} />
    <DashboardStack.Screen name="ActivitiesDashboard" component={ActivitiesDashboardScreen as any} options={{ title: 'Activities' }} />
  </DashboardStack.Navigator>
);

const profileScreenOptions = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.textPrimary,
  headerShadowVisible: false,
};

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={profileScreenOptions}>
    <ProfileStack.Screen name="ProfileHome"     component={ProfileScreen as any}         options={{ headerShown: false }} />
    <ProfileStack.Screen name="PersonalInfo"    component={PersonalInfoScreen as any}    options={{ title: 'Personal Info' }} />
    <ProfileStack.Screen name="DiabetesProfile" component={DiabetesProfileScreen as any} options={{ title: 'Diabetes Profile' }} />
    <ProfileStack.Screen name="GlucoseTargets"  component={GlucoseTargetsScreen as any}  options={{ title: 'Glucose Targets' }} />
    <ProfileStack.Screen name="Notifications"   component={NotificationsScreen as any}   options={{ title: 'Notifications' }} />
    <ProfileStack.Screen name="PrivacySecurity" component={PrivacySecurityScreen as any} options={{ title: 'Privacy & Security' }} />
    <ProfileStack.Screen name="ExportData"      component={ExportDataScreen as any}      options={{ title: 'Export Data' }} />
    <ProfileStack.Screen name="HelpSupport"     component={HelpSupportScreen as any}     options={{ title: 'Help & Support' }} />
  </ProfileStack.Navigator>
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
    <Tab.Screen name="Dashboard" component={DashboardNavigator as any} />
    <Tab.Screen name="Log" component={LogNavigator} />
    <Tab.Screen name="Insights" component={InsightsScreen as any} />
    <Tab.Screen name="Care" component={CareScreen as any} />
    <Tab.Screen name="Profile" component={ProfileNavigator as any} />
  </Tab.Navigator>
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
