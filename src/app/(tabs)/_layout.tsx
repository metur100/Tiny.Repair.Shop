import { Tabs } from 'expo-router/tabs';

import { BottomTabBar } from '@/components/BottomTabBar';
import { palette } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.cream } }}>
      <Tabs.Screen name="workshop" />
      <Tabs.Screen name="jobs" />
      <Tabs.Screen name="collection" />
      <Tabs.Screen name="shop" />
    </Tabs>
  );
}
