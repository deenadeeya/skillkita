import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabaseClient';

type Course = {
  id: string;
  name: string;
  date: string;
  details: string;
  poster: ImageSourcePropType | { uri: string };
};

type Experience = {
  id: string;
  name: string;
  date: string;
  details: string;
  photos?: { uri: string }[];
};

type LandingContentRow = {
  id: number;
  cover_description: string;
  who_image_url: string | null;
  who_description: string;
  updated_at: string;
};

type CourseRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  poster_url: string | null;
  is_visible: boolean;
  created_at: string;
};

type ExperienceRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  photo_urls: string[] | null;
  created_at: string;
};

const BRAND = {
  background: '#F5F1E8',
  primary: '#0001fc',
  accent: '#7A1F1F',
  accentPressed: '#5f1818',
  card: '#ffffff',
};

const placeholderPoster = { uri: 'https://picsum.photos/420/594' };
const fallbackWhoImage = { uri: 'https://picsum.photos/1200/800' };

export default function HomeScreen() {
  const [coverDescription, setCoverDescription] = useState('');
  const [whoImageUrl, setWhoImageUrl] = useState<string | null>(null);
  const [whoDescription, setWhoDescription] = useState(
    'TAWAU RESOURCES & SKILLS CENTRE is a Bumiputera Company. This company has been registered under the Trade License Ordinance 1948 in 2023 in the field of services and learning activities.\n\nThis company has also been registered with the Ministry of Finance (MoF) in 2023 as a Welding Competency Assessment (Accreditation) Centre for CIDB'
  );

  const [upcomingCourses, setUpcomingCourses] = useState<Course[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const whoParagraphs = useMemo(
    () =>
      whoDescription
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean),
    [whoDescription]
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const todayIso = new Date().toISOString().slice(0, 10);

        const [landingRes, coursesRes, expRes] = await Promise.all([
          supabase
            .from('landing_content')
            .select('id,cover_description,who_image_url,who_description,updated_at')
            .eq('id', 1)
            .maybeSingle(),
          supabase
            .from('courses')
            .select('id,name,date,details,poster_url,is_visible,created_at')
            .eq('is_visible', true)
            .gte('date', todayIso)
            .order('date', { ascending: true })
            .limit(8),
          supabase
            .from('experiences')
            .select('id,name,date,details,photo_urls,created_at')
            .order('date', { ascending: false })
            .order('created_at', { ascending: false }),
        ]);

        if (landingRes.error) throw new Error(landingRes.error.message);
        if (coursesRes.error) throw new Error(coursesRes.error.message);
        if (expRes.error) throw new Error(expRes.error.message);

        if (!isMounted) return;

        const landing = landingRes.data as LandingContentRow | null;
        if (landing) {
          setCoverDescription(landing.cover_description ?? coverDescription);
          setWhoImageUrl(landing.who_image_url);
          setWhoDescription(landing.who_description ?? whoDescription);
        }

        const courses = ((coursesRes.data ?? []) as CourseRow[]).map((c) => ({
          id: c.id,
          name: c.name,
          date: c.date,
          details: c.details,
          poster: c.poster_url ? ({ uri: c.poster_url } as const) : placeholderPoster,
        }));
        setUpcomingCourses(courses);

        const exps = ((expRes.data ?? []) as ExperienceRow[]).map((e) => ({
          id: e.id,
          name: e.name,
          date: e.date,
          details: e.details,
          photos: (e.photo_urls ?? []).map((u) => ({ uri: u })),
        }));
        setExperiences(exps);

        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setIsLoading(false);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load landing page.');
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeCourseIndex, setActiveCourseIndex] = useState(0);

  const showPreviousCourse = () => {
    if (upcomingCourses.length === 0) return;
    setActiveCourseIndex((prev) => (prev === 0 ? upcomingCourses.length - 1 : prev - 1));
  };

  const showNextCourse = () => {
    if (upcomingCourses.length === 0) return;
    setActiveCourseIndex((prev) => (prev === upcomingCourses.length - 1 ? 0 : prev + 1));
  };

  const activeCourse = upcomingCourses[activeCourseIndex];
  const visibleCourses = activeCourse ? [activeCourse] : [];
  const screenWidth = Dimensions.get('window').width;
  const experiencesColumns = screenWidth >= 740 ? 2 : 1;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: BRAND.background }]} contentContainerStyle={styles.content}>
      <View style={styles.heroSection}>
        <ThemedText style={[styles.heroTitle, { color: BRAND.primary }]}>
          Tawau Resources &amp; Skills Centre
        </ThemedText>

        <ThemedText style={styles.heroSubtitle}>
          Practical skills training, welding competency and industry-ready programs in Tawau.
        </ThemedText>

        <View style={styles.heroActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse upcoming training courses"
            onPress={() => {
              // TODO: wire to courses list screen when available
            }}
            style={({ pressed }) => [
              styles.heroPrimaryCta,
              { backgroundColor: pressed ? BRAND.primary : BRAND.accent },
            ]}>
            <ThemedText style={styles.heroPrimaryCtaText}>Browse Courses</ThemedText>
          </Pressable>
        </View>
      </View>

      {isLoading && (
        <View style={[styles.noticeCard, { backgroundColor: BRAND.card }]}>
          <ThemedText style={[styles.noticeTitle, { color: BRAND.accent }]}>Loading content…</ThemedText>
          <ThemedText style={styles.noticeBody}>
            Fetching landing content, upcoming courses, and experiences.
          </ThemedText>
        </View>
      )}

      {!!errorMessage && (
        <View style={[styles.noticeCard, { backgroundColor: BRAND.card }]}>
          <ThemedText style={[styles.noticeTitle, { color: BRAND.accent }]}>Couldn’t load live content</ThemedText>
          <ThemedText style={styles.noticeBody}>{errorMessage}</ThemedText>
        </View>
      )}

      <View style={[styles.heroCard, { backgroundColor: BRAND.card }]}>
        <Image
          source={whoImageUrl ? ({ uri: whoImageUrl } as const) : fallbackWhoImage}
          style={styles.heroImage}
          contentFit="cover"
        />
      </View>

      <View style={styles.sectionBody}>
        {whoParagraphs.map((p) => (
          <ThemedText key={p.slice(0, 32)} style={styles.paragraph}>
            {p}
          </ThemedText>
        ))}
      </View>

      <ThemedText type="subtitle" style={[styles.sectionTitle, { color: BRAND.primary }]}>
        Upcoming Courses
      </ThemedText>

      <View style={styles.carouselRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show previous upcoming course"
          onPress={showPreviousCourse}
          disabled={upcomingCourses.length === 0}
          style={({ pressed }) => [
            styles.navButton,
            { backgroundColor: pressed ? BRAND.accentPressed : BRAND.accent, opacity: upcomingCourses.length === 0 ? 0.5 : 1 },
          ]}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>

        <View style={styles.coursesContainer}>
          {visibleCourses.length === 0 ? (
            <View style={[styles.courseCard, { backgroundColor: BRAND.card }]}>
              <ThemedText style={[styles.meta, { color: BRAND.accent }]}>No upcoming courses yet.</ThemedText>
              <ThemedText style={[styles.cardTitle, { color: BRAND.primary }]}>Check back soon</ThemedText>
              <ThemedText style={styles.cardBody}>
                New courses will appear here once published in the admin dashboard.
              </ThemedText>
              <Image source={placeholderPoster} style={styles.poster} contentFit="cover" />
            </View>
          ) : (
            <View style={[styles.courseGrid, styles.courseGridOne]}>
              {visibleCourses.map((course) => (
                <View key={course.id} style={[styles.courseCard, { backgroundColor: BRAND.card }]}>
                  <ThemedText style={[styles.meta, { color: BRAND.accent }]}>Date: {course.date}</ThemedText>
                  <ThemedText style={[styles.cardTitle, { color: BRAND.primary }]}>{course.name}</ThemedText>
                  <ThemedText style={styles.cardBody}>{course.details}</ThemedText>
                  <Image source={course.poster} style={styles.poster} contentFit="cover" />
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show next upcoming course"
          onPress={showNextCourse}
          disabled={upcomingCourses.length === 0}
          style={({ pressed }) => [
            styles.navButton,
            { backgroundColor: pressed ? BRAND.accentPressed : BRAND.accent, opacity: upcomingCourses.length === 0 ? 0.5 : 1 },
          ]}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Show all courses"
        onPress={() => {
          // TODO: wire to a real Courses screen route when available
        }}
        style={({ pressed }) => [
          styles.primaryCta,
          { backgroundColor: pressed ? BRAND.accentPressed : BRAND.accent },
        ]}>
        <ThemedText style={styles.primaryCtaText}>Show All Courses</ThemedText>
      </Pressable>

      <ThemedText type="subtitle" style={[styles.sectionTitle, { color: BRAND.primary }]}>
        Experiences
      </ThemedText>

      <View style={[styles.expGrid, experiencesColumns === 2 ? styles.expGridTwo : styles.expGridOne]}>
        {experiences.map((exp) => (
          <View key={exp.id} style={[styles.expCard, { backgroundColor: BRAND.card }]}>
            <ThemedText style={[styles.cardTitle, { color: BRAND.primary }]}>{exp.name}</ThemedText>
            <ThemedText style={[styles.meta, { color: BRAND.accent }]}>Date: {exp.date}</ThemedText>
            <ThemedText style={styles.cardBody}>{exp.details}</ThemedText>

            {(exp.photos?.length ?? 0) > 0 && (
              <View style={styles.photoGrid}>
                {(exp.photos ?? []).slice(0, 6).map((p) => (
                  <Image key={p.uri} source={p} style={styles.photo} contentFit="cover" />
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 48,
    alignItems: 'center',
  },
  heroSection: {
    width: '100%',
    maxWidth: 720,
    paddingHorizontal: 4,
    marginBottom: 18,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 4,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#4B4B4B',
    paddingHorizontal: 6,
    marginBottom: 14,
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  heroPrimaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 180,
  },
  heroPrimaryCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  noticeCard: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  noticeBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  heroCard: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  sectionBody: {
    width: '100%',
    maxWidth: 720,
    paddingHorizontal: 4,
    marginTop: 10,
    marginBottom: 22,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    width: '100%',
    maxWidth: 720,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 12,
    fontSize: 22,
  },
  carouselRow: {
    width: '100%',
    maxWidth: 900,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navButton: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coursesContainer: {
    flex: 1,
  },
  courseGrid: {
    gap: 12,
  },
  courseGridOne: {
    flexDirection: 'column',
  },
  courseGridTwo: {
    flexDirection: 'row',
  },
  courseCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  meta: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  cardBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  poster: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: 12,
  },
  primaryCta: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  expGrid: {
    width: '100%',
    maxWidth: 900,
    gap: 14,
  },
  expGridOne: {
    flexDirection: 'column',
  },
  expGridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  expCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  photoGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 14,
  },
});