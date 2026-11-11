import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightIcon?: React.ReactNode;
  onRightPress?: () => void;
  avatarUri?: string | null;
  avatarInitial?: string;
}

export default function Header({
  title,
  subtitle,
  onBack,
  rightIcon,
  onRightPress,
  avatarUri,
  avatarInitial,
}: HeaderProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border || '#333' }]}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={[styles.backText, { color: theme.primary }]}>←</Text>
          </TouchableOpacity>
        )}
        {(avatarUri || avatarInitial) && (
          <View style={[styles.avatar, { backgroundColor: avatarUri ? 'transparent' : theme.primary }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.background }]}>{avatarInitial}</Text>
            )}
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={styles.rightBtn} activeOpacity={0.7}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, paddingTop: 50, borderBottomWidth: 1 },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtn: { padding: 8, marginRight: 8 },
  backText: { fontSize: 26, fontWeight: 'bold' },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  titleContainer: { flex: 1 },
  title: { fontSize: 17, fontWeight: 'bold' },
  subtitle: { fontSize: 13, marginTop: 2 },
  rightBtn: { padding: 8 },
});
