import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

// Type for skills
type Skill = {
  id: string;
  name: string;
  description: string;
};

export default function HomeScreen() {
  const sampleSkills: Skill[] = [
    { id: '1', name: 'JavaScript', description: 'Programming language' },
    { id: '2', name: 'UI Design', description: 'Designing user interfaces' },
    { id: '3', name: 'Public Speaking', description: 'Communication skill' },
  ];

  const [skills, setSkills] = useState<Skill[]>([]); // <- type added

  useEffect(() => {
    setSkills(sampleSkills);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SkillKita Prototype</Text>

      <FlatList
        data={skills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.skillName}>{item.name}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 12, backgroundColor: '#eee', borderRadius: 8, marginBottom: 10 },
  skillName: { fontWeight: 'bold', fontSize: 16 },
});