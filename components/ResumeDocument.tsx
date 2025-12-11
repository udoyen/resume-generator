import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5 },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 15, alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#2d3748' },
  spacer: { height: 8 },
  contactRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, fontSize: 10, color: '#718096' },
  link: { color: '#2b6cb0', textDecoration: 'none' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 15, marginBottom: 6, textTransform: 'uppercase', color: '#2b6cb0' },
  jobBlock: { marginBottom: 10 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2, fontWeight: 'bold' },
  bulletPoint: { flexDirection: 'row', marginBottom: 2 },
  bullet: { width: 10, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 10 },
  eduBlock: { marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between' },
  projectBlock: { marginBottom: 10 },
  skillList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillBadge: { backgroundColor: '#ebf8ff', padding: '2 6', borderRadius: 4, fontSize: 9, color: '#2b6cb0' },
});

export const ResumeDocument = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name}>{data.personalInfo.name}</Text>
        <View style={styles.spacer} />
        <View style={styles.contactRow}>
          <Text>{data.personalInfo.email}</Text>
          <Text>|</Text>
          <Link src={data.personalInfo.linkedin} style={styles.link}>LinkedIn Profile</Link>
          <Text>|</Text>
          <Text>{data.personalInfo.phone}</Text>
        </View>
      </View>

      {/* Summary */}
      <View>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={{ fontSize: 10, marginBottom: 10 }}>{data.summary}</Text>
      </View>

      {/* Experience */}
      <View>
        <Text style={styles.sectionTitle}>Experience</Text>
        {data.experience.map((job: any, index: number) => (
          <View key={index} style={styles.jobBlock}>
            <View style={styles.jobHeader}>
              <Text style={{ fontWeight: 'bold' }}>{job.role} | {job.company}</Text>
              <Text style={{ color: '#718096', fontSize: 10 }}>{job.duration}</Text>
            </View>
            {job.description.map((point: string, i: number) => (
              <View key={i} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Projects */}
      {data.projects && data.projects.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Key Projects</Text>
          {data.projects.map((proj: any, index: number) => (
            <View key={index} style={styles.projectBlock}>
              <View style={styles.jobHeader}>
                <Text style={{ fontWeight: 'bold' }}>
                  {proj.name} | {proj.role} {proj.link ? <Link src={proj.link} style={styles.link}>[Link]</Link> : ''}
                </Text>
                <Text style={{ color: '#718096', fontSize: 10 }}>
                  {proj.duration}
                </Text>
              </View>
              {proj.description.map((point: string, i: number) => (
                <View key={i} style={styles.bulletPoint}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Education</Text>
          {data.education.map((edu: any, index: number) => (
            <View key={index} style={styles.eduBlock}>
               <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{edu.institution}</Text>
               <Text style={{ fontSize: 10 }}>{edu.degree} — {edu.year}</Text>
            </View>
          ))}
        </View>
      )}

      {/* UPDATED: Certifications (Removed Date) */}
      {data.certifications && data.certifications.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Certifications & Training</Text>
          {data.certifications.map((cert: any, index: number) => (
            <View key={index} style={styles.eduBlock}>
               <Text style={{ fontWeight: 'bold', fontSize: 10 }}>{cert.name}</Text>
               <Text style={{ fontSize: 10 }}>{cert.issuer}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Skills */}
      <View>
        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.skillList}>
          {data.skills.map((skill: string, index: number) => (
            <Text key={index} style={styles.skillBadge}>{skill}</Text>
          ))}
        </View>
      </View>

    </Page>
  </Document>
);