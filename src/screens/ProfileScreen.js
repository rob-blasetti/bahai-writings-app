import React from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import BaseScreen from '../components/BaseScreen';
import ScreenTitle from '../components/ScreenTitle';

const SOCIAL_CONFIG = [
  { id: 'instagram', icon: 'logo-instagram', label: 'Instagram' },
  { id: 'facebook', icon: 'logo-facebook', label: 'Facebook' },
  { id: 'youtube', icon: 'logo-youtube', label: 'YouTube' },
  { id: 'linkedin', icon: 'logo-linkedin', label: 'LinkedIn' },
  { id: 'tiktok', icon: 'musical-notes-outline', label: 'TikTok' },
  { id: 'x', icon: 'logo-twitter', label: 'X' },
  { id: 'website', icon: 'globe-outline', label: 'Website' },
];

function normalizeRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value;
}

function normalizeString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeUrl(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return null;
}

function findNestedValue(record, matcher, visited = new Set()) {
  const normalizedRecord = normalizeRecord(record);
  if (!normalizedRecord || visited.has(normalizedRecord)) {
    return null;
  }

  visited.add(normalizedRecord);

  for (const [key, value] of Object.entries(normalizedRecord)) {
    if (matcher(key, value)) {
      return value;
    }

    if (normalizeRecord(value)) {
      const nestedMatch = findNestedValue(value, matcher, visited);
      if (nestedMatch != null) {
        return nestedMatch;
      }
    }
  }

  return null;
}

function findFirstString(sources, keys) {
  const normalizedKeys = keys.map(key => key.toLowerCase());

  for (const source of sources) {
    const match = findNestedValue(source, key => normalizedKeys.includes(key.toLowerCase()));
    const normalized = normalizeString(match);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function resolveAvatarUrl(sources) {
  const directKeys = [
    'avatarUrl',
    'avatarURL',
    'avatar',
    'photoUrl',
    'photoURL',
    'imageUrl',
    'imageURL',
    'profileImage',
    'profileImageUrl',
    'profilePicture',
    'profilePictureUrl',
    'picture',
  ];
  const directValue = normalizeUrl(findFirstString(sources, directKeys));
  if (directValue) {
    return directValue;
  }

  for (const source of sources) {
    const nestedAsset = findNestedValue(
      source,
      (key, value) =>
        ['avatar', 'photo', 'image', 'picture', 'profilePicture'].includes(key) &&
        normalizeRecord(value),
    );
    const nestedUrl = normalizeUrl(
      nestedAsset?.url ?? nestedAsset?.src ?? nestedAsset?.uri,
    );
    if (nestedUrl) {
      return nestedUrl;
    }
  }

  return null;
}

function buildSocialUrl(kind, value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const handle = normalized.replace(/^@/, '');
  if (!handle) {
    return null;
  }

  switch (kind) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'youtube':
      return `https://youtube.com/${handle}`;
    case 'linkedin':
      return `https://linkedin.com/in/${handle}`;
    case 'tiktok':
      return `https://www.tiktok.com/@${handle}`;
    case 'x':
      return `https://x.com/${handle}`;
    case 'website':
      return `https://${handle}`;
    default:
      return null;
  }
}

function resolveSocialLinks(sources) {
  const socialFieldMap = {
    instagram: ['instagram', 'instagramUrl', 'instagramURL', 'instagramHandle'],
    facebook: ['facebook', 'facebookUrl', 'facebookURL', 'facebookHandle'],
    youtube: ['youtube', 'youtubeUrl', 'youtubeURL', 'youtubeHandle'],
    linkedin: ['linkedin', 'linkedinUrl', 'linkedinURL', 'linkedinHandle'],
    tiktok: ['tiktok', 'tikTok', 'tiktokUrl', 'tikTokUrl', 'tiktokHandle'],
    x: ['x', 'xUrl', 'xURL', 'twitter', 'twitterUrl', 'twitterURL', 'twitterHandle'],
    website: ['website', 'websiteUrl', 'websiteURL', 'url', 'link'],
  };

  return SOCIAL_CONFIG.map(item => {
    const rawValue = findFirstString(sources, socialFieldMap[item.id] ?? []);
    const url = buildSocialUrl(item.id, rawValue);
    if (!url) {
      return null;
    }

    return {
      ...item,
      value: rawValue,
      url,
    };
  }).filter(Boolean);
}

function getInitials(name) {
  const normalized = normalizeString(name);
  if (!normalized) {
    return 'K';
  }

  const segments = normalized.split(/\s+/).filter(Boolean);
  return segments
    .slice(0, 2)
    .map(segment => segment[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfileScreen({
  styles,
  displayName = 'Friend',
  user = null,
  kaliUser = null,
  rawPayload = null,
  email = '',
  memberRef = '',
  isAuthenticated = false,
}) {
  const normalizedEmail =
    typeof email === 'string' && email.trim().length > 0 ? email.trim() : '';
  const sources = [kaliUser, user, rawPayload].map(normalizeRecord).filter(Boolean);
  const resolvedName =
    findFirstString(sources, [
      'fullName',
      'displayName',
      'name',
      'preferredName',
      'firstName',
      'givenName',
    ]) ??
    normalizeString(displayName) ??
    'Friend';
  const resolvedBahaiId =
    findFirstString(sources, [
      'bahaiId',
      'bahaiID',
      'bahai_id',
      'memberRef',
      'memberID',
      'memberId',
      'member_id',
      'id',
    ]) ?? normalizeString(memberRef);
  const avatarUrl = resolveAvatarUrl(sources);
  const socialLinks = resolveSocialLinks(sources);
  const openSocialLink = async url => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Unable to open link', 'This social profile could not be opened.');
    }
  };

  return (
    <BaseScreen styles={styles} variant="plain" style={styles.homeContainer}>
      <ScreenTitle styles={styles} title="Profile" />
      {isAuthenticated ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.profileScrollContent}
        >
          <View style={styles.profileHeroCard}>
            <View style={styles.profileBanner} />
            <View style={styles.profileAvatarShell}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} />
              ) : (
                <View style={styles.profileAvatarFallback}>
                  <Text style={styles.profileAvatarInitials}>
                    {getInitials(resolvedName)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.profileName}>{resolvedName}</Text>
            {normalizedEmail ? (
              <Text style={styles.profileEmail}>{normalizedEmail}</Text>
            ) : null}
            {resolvedBahaiId ? (
              <View style={styles.profileBahaiIdPill}>
                <Text style={styles.profileBahaiIdLabel}>Bahai ID</Text>
                <Text style={styles.profileBahaiIdValue}>{resolvedBahaiId}</Text>
              </View>
            ) : null}
          </View>

          {socialLinks.length ? (
            <View style={styles.profileSectionCard}>
              <Text style={styles.profileSectionTitle}>Social Accounts</Text>
              <Text style={styles.profileSectionSubtitle}>
                Open this profile across linked platforms.
              </Text>
              <View style={styles.profileSocialGrid}>
                {socialLinks.map(link => (
                  <TouchableOpacity
                    key={link.id}
                    onPress={() => openSocialLink(link.url)}
                    style={styles.profileSocialButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${link.label}`}
                  >
                    <View style={styles.profileSocialIconWrap}>
                      <Ionicons
                        name={link.icon}
                        size={20}
                        color="#3b2a15"
                      />
                    </View>
                    <Text style={styles.profileSocialLabel}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <Text style={styles.bottomNavScreenSubtitle}>
          Sign in with your Liquid Spirit account to personalize the app.
        </Text>
      )}
    </BaseScreen>
  );
}
