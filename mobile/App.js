import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DemoDataProvider } from './contexts/DemoDataContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DashboardScreen from './screens/DashboardScreen';
import CoursesScreen from './screens/CoursesScreen';
import CreateCourseScreen from './screens/CreateCourseScreen';
import AssignmentsScreen from './screens/AssignmentsScreen';
import PeopleScreen from './screens/PeopleScreen';
import MessagesScreen from './screens/MessagesScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function getUserInitials(name) {
  if (!name) return 'CP';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0] || '';
  const last = parts[parts.length - 1]?.[0] || '';
  return (first + last).toUpperCase();
}

function useHeaderOptions(navigation, title) {
  const { userProfile } = useAuth();
  const notifications = 3; // TODO: conectar a store/context cuando esté listo

  return {
    title,
    headerTitleAlign: 'left',
    headerTitle: () => (
      <View style={{ flexDirection: 'column' }}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: '700', 
          color: '#007AFF',
          textAlign: 'left'
        }}>
          {title}
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#8E8E93', 
          marginTop: 2,
          fontWeight: '500'
        }}>
          {userProfile?.role === 'teacher' ? 'Docente' : 'Estudiante'} • ClassPad
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('Profile')}
        style={{ marginLeft: 16 }}
        accessibilityLabel="Perfil"
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#007AFF',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
            {getUserInitials(userProfile?.fullName)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity
        onPress={() => navigation.navigate('Messages')}
        accessibilityLabel="Notificaciones"
        style={{ marginRight: 16 }}
      >
        <View>
          <MaterialIcons name="notifications-none" size={28} color="#007AFF" />
          {notifications > 0 && (
            <View
              style={{
                position: 'absolute',
                right: -6,
                top: -4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#FF3B30',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
                shadowColor: '#FF3B30',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
                elevation: 3,
              }}
            >
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                {notifications > 99 ? '99+' : notifications}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
    headerStyle: {
      backgroundColor: '#FFFFFF',
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5EA',
    },
    headerShadowVisible: false,
  };
}

function MainTabs() {
  const { userProfile } = useAuth();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let IconComponent = MaterialIcons;

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Courses') {
            iconName = 'book';
          } else if (route.name === 'Assignments') {
            iconName = 'description';
          } else if (route.name === 'Attendance') {
            iconName = 'analytics';
          } else if (route.name === 'Profile') {
            iconName = 'account-circle';
          }

          return (
            <IconComponent 
              name={iconName} 
              size={focused ? size + 4 : size + 2} 
              color={color}
              style={{
                opacity: focused ? 1 : 0.6,
                transform: [{ scale: focused ? 1.15 : 1 }]
              }}
            />
          );
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          paddingBottom: Platform.OS === 'android' ? 20 : 10,
          paddingTop: 8,
          height: Platform.OS === 'android' ? 80 : 70,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingHorizontal: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarHideOnKeyboard: true,
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={({ navigation }) => ({ 
          title: 'Inicio',
          ...useHeaderOptions(navigation, 'Inicio'),
        })}
      />
      <Tab.Screen 
        name="Courses" 
        component={CoursesScreen} 
        options={({ navigation }) => ({ 
          title: 'Cursos',
          ...useHeaderOptions(navigation, 'Cursos'),
        })}
      />
      <Tab.Screen 
        name="Assignments" 
        component={AssignmentsScreen} 
        options={({ navigation }) => ({ 
          title: 'Tareas',
          ...useHeaderOptions(navigation, 'Tareas'),
        })}
      />
      <Tab.Screen 
        name="Attendance" 
        component={AttendanceScreen} 
        options={({ navigation }) => ({ 
          title: 'Asistencia',
          ...useHeaderOptions(navigation, 'Asistencia'),
        })}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={({ navigation }) => ({ 
          title: 'Perfil',
          ...useHeaderOptions(navigation, 'Perfil'),
        })}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {currentUser ? (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="CreateCourse" component={CreateCourseScreen} />
              <Stack.Screen name="Messages" component={MessagesScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DemoDataProvider>
          <AppContent />
        </DemoDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
