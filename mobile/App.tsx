import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import {
  getOverview,
  getPreferences,
  getTerrainArea,
  getTrail,
  setTerrainPreference,
  setTrailPreference,
} from './src/api';
import { OverviewResponse, PreferencesResponse, TerrainAreaResponse, TrailResponse } from './src/types';

type RootStackParamList = {
  Home: undefined;
  TerrainArea: { slug: string; name?: string };
  Trail: { slug: string; name?: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const queryClient = new QueryClient();

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type TerrainAreaScreenProps = NativeStackScreenProps<RootStackParamList, 'TerrainArea'>;
type TrailScreenProps = NativeStackScreenProps<RootStackParamList, 'Trail'>;

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function HomeScreen({ navigation }: HomeScreenProps) {
  const overview = useQuery<OverviewResponse>({ queryKey: ['overview'], queryFn: getOverview });
  const prefs = useQuery<PreferencesResponse>({ queryKey: ['prefs'], queryFn: getPreferences });

  if (overview.isLoading) return <CenteredLoader text="Loading overview..." />;
  if (overview.error) return <ErrorState message="Failed to load overview" />;

  const favoriteTrails = prefs.data?.trails ?? [];
  const favoriteAreas = prefs.data?.terrain_areas ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionHeader title="Lifts" />
        {overview.data?.lifts.map((lift) => (
          <View key={lift.slug} style={styles.card}>
            <Text style={styles.title}>{lift.name}</Text>
            <Text style={styles.subtitle}>{lift.is_open ? 'Open' : 'Closed'}</Text>
          </View>
        ))}

        <SectionHeader title="Terrain Areas" />
        {overview.data?.terrain_areas.map((area) => (
          <Pressable
            key={area.slug}
            style={styles.card}
            onPress={() => navigation.navigate('TerrainArea', { slug: area.slug, name: area.name })}
          >
            <Text style={styles.title}>{area.name}</Text>
            <Text style={styles.subtitle}>{area.status}</Text>
          </Pressable>
        ))}

        <SectionHeader title="Favorites" />
        {favoriteAreas.map((area) => (
          <Pressable
            key={`fav-area-${area.id}`}
            style={styles.card}
            onPress={() => navigation.navigate('TerrainArea', { slug: area.slug, name: area.name })}
          >
            <Text style={styles.title}>{area.name}</Text>
            <Text style={styles.subtitle}>Terrain area notifications on</Text>
          </Pressable>
        ))}
        {favoriteTrails.map((trail) => (
          <Pressable
            key={`fav-trail-${trail.id}`}
            style={styles.card}
            onPress={() => navigation.navigate('Trail', { slug: trail.slug, name: trail.name })}
          >
            <Text style={styles.title}>{trail.name}</Text>
            <Text style={styles.subtitle}>
              {trail.difficulty ? `${trail.difficulty} · ` : ''}
              notifications on
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function TerrainAreaScreen({ route }: TerrainAreaScreenProps) {
  const { slug, name } = route.params;
  const { data, isLoading, error } = useQuery<TerrainAreaResponse>({
    queryKey: ['terrain-area', slug],
    queryFn: () => getTerrainArea(slug),
  });
  const prefs = useQuery<PreferencesResponse>({ queryKey: ['prefs'], queryFn: getPreferences });
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => setTerrainPreference(data?.terrain_area.id ?? 0, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prefs'] }),
  });

  const enabled = useMemo(() => {
    const id = data?.terrain_area.id;
    if (!id || !prefs.data) return false;
    return prefs.data.terrain_areas.some((a) => a.id === id);
  }, [data, prefs.data]);

  if (isLoading) return <CenteredLoader text="Loading terrain area..." />;
  if (error || !data) return <ErrorState message="Failed to load terrain area" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>{name || data.terrain_area.name}</Text>
        <Text style={styles.subtitle}>Status: {data.terrain_area.status}</Text>
        {!!data.terrain_area.notes && <Text style={styles.subtitle}>Notes: {data.terrain_area.notes}</Text>}
        <View style={styles.toggleRow}>
          <Text style={styles.title}>Notify me for changes</Text>
          <Switch
            value={enabled}
            onValueChange={(value) => mutation.mutate(value)}
            trackColor={{ true: '#2563eb' }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TrailScreen({ route }: TrailScreenProps) {
  const { slug, name } = route.params;
  const { data, isLoading, error } = useQuery<TrailResponse>({
    queryKey: ['trail', slug],
    queryFn: () => getTrail(slug),
  });
  const prefs = useQuery<PreferencesResponse>({ queryKey: ['prefs'], queryFn: getPreferences });
  const mutation = useMutation({
    mutationFn: (enabled: boolean) => setTrailPreference(data?.trail.id ?? 0, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prefs'] }),
  });

  const enabled = useMemo(() => {
    const id = data?.trail.id;
    if (!id || !prefs.data) return false;
    return prefs.data.trails.some((t) => t.id === id);
  }, [data, prefs.data]);

  if (isLoading) return <CenteredLoader text="Loading trail..." />;
  if (error || !data) return <ErrorState message="Failed to load trail" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>{name || data.trail.name}</Text>
        <Text style={styles.subtitle}>Status: {data.trail.status}</Text>
        <Text style={styles.subtitle}>Difficulty: {data.trail.difficulty || 'n/a'}</Text>
        <Text style={styles.subtitle}>Groomed: {data.trail.is_groomed ? 'Yes' : 'No'}</Text>
        {!!data.trail.lift && <Text style={styles.subtitle}>Lift: {data.trail.lift.name}</Text>}

        <View style={styles.toggleRow}>
          <Text style={styles.title}>Notify me for changes</Text>
          <Switch
            value={enabled}
            onValueChange={(value) => mutation.mutate(value)}
            trackColor={{ true: '#2563eb' }}
          />
        </View>

        <SectionHeader title="Recent changes" />
        {data.history.map((h) => (
          <View key={h.id} style={styles.card}>
            <Text style={styles.subtitle}>
              {h.old_status ?? 'unknown'} → {h.new_status}
            </Text>
            <Text style={styles.small}>{new Date(h.changed_at).toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsScreen() {
  const prefs = useQuery<PreferencesResponse>({ queryKey: ['prefs'], queryFn: getPreferences });
  const toggleTerrain = useMutation({
    mutationFn: (args: { id: number; enabled: boolean }) => setTerrainPreference(args.id, args.enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prefs'] }),
  });
  const toggleTrail = useMutation({
    mutationFn: (args: { id: number; enabled: boolean }) => setTrailPreference(args.id, args.enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prefs'] }),
  });

  if (prefs.isLoading) return <CenteredLoader text="Loading preferences..." />;
  if (prefs.error) return <ErrorState message="Failed to load preferences" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionHeader title="Terrain Areas" />
        {prefs.data?.terrain_areas.map((area) => (
          <View key={area.id} style={styles.toggleRow}>
            <Text style={styles.title}>{area.name}</Text>
            <Switch
              value
              onValueChange={(enabled) => toggleTerrain.mutate({ id: area.id, enabled })}
              trackColor={{ true: '#2563eb' }}
            />
          </View>
        ))}

        <SectionHeader title="Trails" />
        {prefs.data?.trails.map((trail) => (
          <View key={trail.id} style={styles.toggleRow}>
            <Text style={styles.title}>{trail.name}</Text>
            <Switch
              value
              onValueChange={(enabled) => toggleTrail.mutate({ id: trail.id, enabled })}
              trackColor={{ true: '#2563eb' }}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CenteredLoader({ text }: { text: string }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator />
      <Text style={styles.subtitle}>{text}</Text>
    </View>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.subtitle}>{message}</Text>
    </View>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="TerrainArea"
            component={TerrainAreaScreen}
            options={({ route }: { route: { params: RootStackParamList['TerrainArea'] } }) => ({
              title: route.params.name || 'Terrain Area',
            })}
          />
          <Stack.Screen
            name="Trail"
            component={TrailScreen}
            options={({ route }: { route: { params: RootStackParamList['Trail'] } }) => ({
              title: route.params.name || 'Trail',
            })}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#475569', marginTop: 2 },
  small: { fontSize: 12, color: '#94a3b8' },
  sectionHeader: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 6, color: '#0f172a' },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 6, color: '#0f172a' },
  toggleRow: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
});
