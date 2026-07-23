import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Kind = 'folder' | 'document' | 'image' | 'sheet' | 'presentation' | 'archive';
type Section = 'Home' | 'My Drive' | 'Shared' | 'Recent' | 'Starred' | 'Trash';
type Item = {
  id: string;
  name: string;
  kind: Kind;
  owner: string;
  updated: string;
  size: string;
  starred?: boolean;
  shared?: boolean;
};

const seed: Item[] = [
  { id: '1', name: 'Product Design', kind: 'folder', owner: 'You', updated: 'Today', size: '12 items', starred: true },
  { id: '2', name: 'Research Library', kind: 'folder', owner: 'You', updated: 'Yesterday', size: '38 items', shared: true },
  { id: '3', name: 'Launch Planning', kind: 'folder', owner: 'You', updated: 'Jul 20', size: '9 items' },
  { id: '4', name: 'Unidac Drive brief.pdf', kind: 'document', owner: 'You', updated: 'Today', size: '2.4 MB', starred: true },
  { id: '5', name: 'Interface concepts.png', kind: 'image', owner: 'Maya Chen', updated: 'Yesterday', size: '8.1 MB', shared: true },
  { id: '6', name: 'Feature priorities.xlsx', kind: 'sheet', owner: 'You', updated: 'Jul 19', size: '712 KB' },
  { id: '7', name: 'Alpha presentation.pptx', kind: 'presentation', owner: 'You', updated: 'Jul 17', size: '4.8 MB', shared: true },
  { id: '8', name: 'Brand assets.zip', kind: 'archive', owner: 'You', updated: 'Jul 14', size: '32 MB' },
];

const nav: { label: Section; icon: string }[] = [
  { label: 'Home', icon: '⌂' },
  { label: 'My Drive', icon: '▣' },
  { label: 'Shared', icon: '♧' },
  { label: 'Recent', icon: '◷' },
  { label: 'Starred', icon: '☆' },
  { label: 'Trash', icon: '⌫' },
];

const fileStyle: Record<Kind, { icon: string; color: string; background: string }> = {
  folder: { icon: '▰', color: '#7C3AED', background: '#F0E9FF' },
  document: { icon: '≡', color: '#2563EB', background: '#EAF2FF' },
  image: { icon: '◩', color: '#DB2777', background: '#FCE7F3' },
  sheet: { icon: '▦', color: '#059669', background: '#E7F8F1' },
  presentation: { icon: '▤', color: '#EA580C', background: '#FFF0E6' },
  archive: { icon: '▧', color: '#64748B', background: '#EDF1F5' },
};

function formatBytes(bytes?: number) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getKind(name: string, mime = ''): Kind {
  const value = `${name} ${mime}`.toLowerCase();
  if (/png|jpg|jpeg|gif|webp|image/.test(value)) return 'image';
  if (/xlsx|xls|csv|spreadsheet/.test(value)) return 'sheet';
  if (/pptx|ppt|presentation/.test(value)) return 'presentation';
  if (/zip|rar|7z|archive/.test(value)) return 'archive';
  return 'document';
}

export default function DriveHome() {
  const { width } = useWindowDimensions();
  const mobile = width < 760;
  const showDetails = width >= 1180;
  const [section, setSection] = useState<Section>('Home');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>(seed);
  const [selected, setSelected] = useState('4');
  const [grid, setGrid] = useState(true);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter((item) => {
      if (search && !item.name.toLowerCase().includes(search)) return false;
      if (section === 'Shared') return item.shared;
      if (section === 'Starred') return item.starred;
      if (section === 'Trash') return false;
      return true;
    });
  }, [items, query, section]);

  const selectedItem = items.find((item) => item.id === selected);
  const folders = visible.filter((item) => item.kind === 'folder');
  const files = visible.filter((item) => item.kind !== 'folder');

  function addFolder() {
    const count = items.filter((item) => item.name.startsWith('Untitled folder')).length;
    const folder: Item = {
      id: `folder-${Date.now()}`,
      name: count ? `Untitled folder ${count + 1}` : 'Untitled folder',
      kind: 'folder',
      owner: 'You',
      updated: 'Just now',
      size: '0 items',
    };
    setItems((current) => [folder, ...current]);
    setSelected(folder.id);
  }

  async function upload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (result.canceled) return;
      const additions: Item[] = result.assets.map((asset, index) => ({
        id: `${Date.now()}-${index}`,
        name: asset.name,
        kind: getKind(asset.name, asset.mimeType),
        owner: 'You',
        updated: 'Just now',
        size: formatBytes(asset.size),
      }));
      setItems((current) => [...additions, ...current]);
      if (additions[0]) setSelected(additions[0].id);
    } catch {
      Alert.alert('Upload unavailable', 'The system file picker could not be opened.');
    }
  }

  function toggleStar(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, starred: !item.starred } : item));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        {!mobile && (
          <View style={styles.sidebar}>
            <View style={styles.brandRow}>
              <View style={styles.logo}><Text style={styles.logoText}>U</Text></View>
              <View><Text style={styles.brand}>Unidac</Text><Text style={styles.product}>DRIVE</Text></View>
            </View>
            <Pressable style={styles.newButton} onPress={addFolder}><Text style={styles.newButtonText}>＋  New folder</Text></Pressable>
            <View style={styles.navList}>
              {nav.map((item) => (
                <Pressable key={item.label} onPress={() => setSection(item.label)} style={[styles.navItem, section === item.label && styles.navActive]}>
                  <Text style={[styles.navIcon, section === item.label && styles.navActiveText]}>{item.icon}</Text>
                  <Text style={[styles.navText, section === item.label && styles.navActiveText]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.storageCard}>
              <View style={styles.storageHeader}><Text style={styles.storageTitle}>Storage</Text><Text style={styles.storagePercent}>24%</Text></View>
              <View style={styles.storageTrack}><View style={styles.storageFill} /></View>
              <Text style={styles.storageCopy}>3.6 GB of 15 GB used</Text>
            </View>
            <View style={styles.profile}>
              <View style={styles.avatar}><Text style={styles.avatarText}>SH</Text></View>
              <View><Text style={styles.profileName}>Saladi Haji</Text><Text style={styles.profilePlan}>Personal workspace</Text></View>
            </View>
          </View>
        )}

        <View style={styles.main}>
          <View style={styles.topbar}>
            {mobile && <View style={styles.logo}><Text style={styles.logoText}>U</Text></View>}
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput value={query} onChangeText={setQuery} placeholder="Search files and folders" placeholderTextColor="#7B8495" style={styles.searchInput} />
              {!!query && <Pressable onPress={() => setQuery('')}><Text style={styles.clear}>×</Text></Pressable>}
            </View>
            <View style={styles.roundButton}><Text style={styles.roundButtonText}>?</Text></View>
          </View>

          <ScrollView contentContainerStyle={[styles.content, mobile && styles.mobileContent]} showsVerticalScrollIndicator={false}>
            <View style={styles.heading}>
              <View>
                <Text style={styles.eyebrow}>UNIDAC WORKSPACE</Text>
                <Text style={styles.title}>{section}</Text>
                <Text style={styles.subtitle}>Keep every project organized and available on every device.</Text>
              </View>
              <View style={styles.actions}>
                <Pressable style={styles.secondaryButton} onPress={addFolder}><Text style={styles.secondaryText}>New folder</Text></Pressable>
                <Pressable style={styles.primaryButton} onPress={upload}><Text style={styles.primaryText}>Upload files</Text></Pressable>
              </View>
            </View>

            {section === 'Home' && !query && (
              <View style={styles.hero}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>WELCOME BACK</Text>
                  <Text style={styles.heroTitle}>Your work is ready when you are.</Text>
                  <Text style={styles.heroBody}>Continue from a recent file, upload new material, or open a clean project folder.</Text>
                  <View style={styles.heroActions}>
                    <Pressable style={styles.heroPrimary} onPress={upload}><Text style={styles.heroPrimaryText}>Upload something</Text></Pressable>
                    <Pressable style={styles.heroSecondary} onPress={addFolder}><Text style={styles.heroSecondaryText}>Create a folder</Text></Pressable>
                  </View>
                </View>
                {!mobile && <Text style={styles.heroArt}>▰</Text>}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>{query ? 'Search results' : folders.length ? 'Folders' : 'Files'}</Text><Text style={styles.count}>{visible.length} items</Text></View>
              <View style={styles.toggle}>
                <Pressable onPress={() => setGrid(true)} style={[styles.toggleButton, grid && styles.toggleActive]}><Text style={[styles.toggleText, grid && styles.toggleTextActive]}>▦</Text></Pressable>
                <Pressable onPress={() => setGrid(false)} style={[styles.toggleButton, !grid && styles.toggleActive]}><Text style={[styles.toggleText, !grid && styles.toggleTextActive]}>☷</Text></Pressable>
              </View>
            </View>

            {!visible.length ? (
              <View style={styles.empty}><Text style={styles.emptyIcon}>⌕</Text><Text style={styles.emptyTitle}>Nothing here yet</Text><Text style={styles.emptyText}>Try another search or add a new file.</Text></View>
            ) : grid ? (
              <>
                <View style={styles.grid}>
                  {folders.map((item) => <Card key={item.id} item={item} active={selected === item.id} mobile={mobile} onPress={() => setSelected(item.id)} onStar={() => toggleStar(item.id)} />)}
                </View>
                {!!files.length && !!folders.length && <Text style={styles.filesHeading}>Files</Text>}
                <View style={styles.grid}>
                  {files.map((item) => <Card key={item.id} item={item} active={selected === item.id} mobile={mobile} onPress={() => setSelected(item.id)} onStar={() => toggleStar(item.id)} />)}
                </View>
              </>
            ) : (
              <View style={styles.list}>
                {visible.map((item, index) => <Row key={item.id} item={item} active={selected === item.id} last={index === visible.length - 1} onPress={() => setSelected(item.id)} />)}
              </View>
            )}
          </ScrollView>
        </View>

        {showDetails && selectedItem && (
          <View style={styles.details}>
            <View style={styles.detailsHeader}><Text style={styles.detailsTitle}>Details</Text><Text style={styles.detailsClose}>×</Text></View>
            <View style={[styles.preview, { backgroundColor: fileStyle[selectedItem.kind].background }]}><Text style={[styles.previewIcon, { color: fileStyle[selectedItem.kind].color }]}>{fileStyle[selectedItem.kind].icon}</Text></View>
            <Text style={styles.detailsName}>{selectedItem.name}</Text>
            <Text style={styles.detailsKind}>{selectedItem.kind.toUpperCase()}</Text>
            <View style={styles.divider} />
            <Detail label="Owner" value={selectedItem.owner} />
            <Detail label="Modified" value={selectedItem.updated} />
            <Detail label="Size" value={selectedItem.size} />
            <Detail label="Access" value={selectedItem.shared ? 'Shared' : 'Only you'} />
            <View style={styles.detailsActions}>
              <Pressable style={styles.primaryButton}><Text style={styles.primaryText}>Open</Text></Pressable>
              <Pressable style={styles.secondaryButton} onPress={() => toggleStar(selectedItem.id)}><Text style={styles.secondaryText}>{selectedItem.starred ? 'Remove star' : 'Add star'}</Text></Pressable>
            </View>
          </View>
        )}
      </View>

      {mobile && (
        <View style={styles.mobileNav}>
          {nav.slice(0, 5).map((item) => (
            <Pressable key={item.label} style={styles.mobileNavItem} onPress={() => setSection(item.label)}>
              <Text style={[styles.mobileNavIcon, section === item.label && styles.mobileNavActive]}>{item.icon}</Text>
              <Text style={[styles.mobileNavText, section === item.label && styles.mobileNavActive]}>{item.label === 'My Drive' ? 'Drive' : item.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function Card({ item, active, mobile, onPress, onStar }: { item: Item; active: boolean; mobile: boolean; onPress: () => void; onStar: () => void }) {
  const meta = fileStyle[item.kind];
  return (
    <Pressable onPress={onPress} style={[styles.card, mobile && styles.mobileCard, active && styles.cardActive]}>
      <View style={styles.cardTop}>
        <View style={[styles.fileIcon, { backgroundColor: meta.background }]}><Text style={[styles.fileGlyph, { color: meta.color }]}>{meta.icon}</Text></View>
        <Pressable onPress={onStar} hitSlop={10}><Text style={[styles.star, item.starred && styles.starred]}>{item.starred ? '★' : '☆'}</Text></Pressable>
      </View>
      <Text style={styles.fileName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.metaRow}><Text style={styles.meta}>{item.updated}</Text><Text style={styles.meta}>{item.size}</Text></View>
      {item.shared && <View style={styles.shared}><Text style={styles.sharedText}>Shared</Text></View>}
    </Pressable>
  );
}

function Row({ item, active, last, onPress }: { item: Item; active: boolean; last: boolean; onPress: () => void }) {
  const meta = fileStyle[item.kind];
  return (
    <Pressable onPress={onPress} style={[styles.row, active && styles.rowActive, last && styles.lastRow]}>
      <View style={[styles.rowIcon, { backgroundColor: meta.background }]}><Text style={[styles.rowGlyph, { color: meta.color }]}>{meta.icon}</Text></View>
      <View style={styles.rowCopy}><Text style={styles.rowName}>{item.name}</Text><Text style={styles.rowMeta}>{item.owner} · {item.updated}</Text></View>
      <Text style={styles.rowSize}>{item.size}</Text>
    </Pressable>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailLine}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F6FA' },
  shell: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 250, backgroundColor: '#111827', padding: 18, paddingTop: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, marginBottom: 30 },
  logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  brand: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  product: { color: '#8FA0BA', fontSize: 9, fontWeight: '800', letterSpacing: 2.3 },
  newButton: { height: 46, borderRadius: 14, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  newButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  navList: { gap: 5 },
  navItem: { height: 43, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 12 },
  navActive: { backgroundColor: '#262D3D' },
  navIcon: { color: '#94A3B8', width: 21, textAlign: 'center', fontSize: 18 },
  navText: { color: '#A8B3C5', fontSize: 14, fontWeight: '600' },
  navActiveText: { color: '#FFFFFF' },
  storageCard: { marginTop: 'auto', backgroundColor: '#1D2637', borderRadius: 16, padding: 14 },
  storageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  storageTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  storagePercent: { color: '#A78BFA', fontSize: 12, fontWeight: '700' },
  storageTrack: { height: 6, borderRadius: 5, backgroundColor: '#38445A', overflow: 'hidden' },
  storageFill: { width: '24%', height: '100%', backgroundColor: '#8B5CF6' },
  storageCopy: { color: '#9CAAC1', fontSize: 11, marginTop: 9 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingHorizontal: 3 },
  avatar: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#F0E9FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#6D28D9', fontSize: 11, fontWeight: '800' },
  profileName: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  profilePlan: { color: '#7F8DA5', fontSize: 9, marginTop: 2 },
  main: { flex: 1, minWidth: 0 },
  topbar: { minHeight: 72, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: { flex: 1, maxWidth: 700, height: 44, borderRadius: 14, backgroundColor: '#ECEFF4', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  searchIcon: { color: '#7B8495', fontSize: 22, marginRight: 8 },
  searchInput: { flex: 1, color: '#172033', fontSize: 14 },
  clear: { color: '#7B8495', fontSize: 22 },
  roundButton: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  roundButtonText: { color: '#172033', fontWeight: '800' },
  content: { paddingHorizontal: 28, paddingBottom: 44 },
  mobileContent: { paddingHorizontal: 16, paddingBottom: 100 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginTop: 16, marginBottom: 24, flexWrap: 'wrap' },
  eyebrow: { color: '#7B8495', fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 6 },
  title: { color: '#172033', fontSize: 32, lineHeight: 38, fontWeight: '800' },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 9 },
  primaryButton: { height: 42, paddingHorizontal: 17, borderRadius: 13, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  secondaryButton: { height: 42, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E1E5EC', borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: '#172033', fontSize: 13, fontWeight: '700' },
  hero: { minHeight: 210, borderRadius: 24, backgroundColor: '#2B195E', overflow: 'hidden', flexDirection: 'row', padding: 28, marginBottom: 30 },
  heroCopy: { flex: 1, maxWidth: 570 },
  heroEyebrow: { color: '#C4B5FD', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 33, fontWeight: '800' },
  heroBody: { color: '#CEC5E7', fontSize: 13, lineHeight: 20, marginTop: 9, maxWidth: 480 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap' },
  heroPrimary: { height: 39, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  heroPrimaryText: { color: '#321F67', fontSize: 12, fontWeight: '800' },
  heroSecondary: { height: 39, borderRadius: 12, borderWidth: 1, borderColor: '#6D5B99', paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  heroSecondaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  heroArt: { color: '#A78BFA', fontSize: 140, lineHeight: 155, width: 230, textAlign: 'center', transform: [{ rotate: '-8deg' }] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: '#172033', fontSize: 18, fontWeight: '800' },
  count: { color: '#7B8495', fontSize: 11, marginTop: 3 },
  toggle: { flexDirection: 'row', borderRadius: 11, padding: 3, backgroundColor: '#FFFFFF' },
  toggleButton: { width: 34, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggleActive: { backgroundColor: '#7C3AED' },
  toggleText: { color: '#7B8495', fontSize: 15 },
  toggleTextActive: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { width: 210, minHeight: 156, borderRadius: 17, borderWidth: 1, borderColor: '#E7EAF0', backgroundColor: '#FFFFFF', padding: 15 },
  mobileCard: { width: '48.2%', minWidth: 150 },
  cardActive: { borderColor: '#8B5CF6' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  fileIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  fileGlyph: { fontSize: 20, fontWeight: '800' },
  star: { color: '#9AA3B2', fontSize: 20 },
  starred: { color: '#F59E0B' },
  fileName: { color: '#172033', fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 14, minHeight: 36 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  meta: { color: '#7B8495', fontSize: 10 },
  shared: { position: 'absolute', right: 12, bottom: 12, borderRadius: 8, backgroundColor: '#EDE9FE', paddingHorizontal: 7, paddingVertical: 3 },
  sharedText: { color: '#6D28D9', fontSize: 8, fontWeight: '800' },
  filesHeading: { color: '#172033', fontSize: 18, fontWeight: '800', marginTop: 26, marginBottom: 14 },
  list: { borderWidth: 1, borderColor: '#E7EAF0', borderRadius: 17, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  row: { minHeight: 66, borderBottomWidth: 1, borderBottomColor: '#E7EAF0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  rowActive: { backgroundColor: '#F5F1FF' },
  lastRow: { borderBottomWidth: 0 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  rowGlyph: { fontSize: 17, fontWeight: '800' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowName: { color: '#172033', fontSize: 12, fontWeight: '700' },
  rowMeta: { color: '#7B8495', fontSize: 9, marginTop: 3 },
  rowSize: { color: '#7B8495', fontSize: 11 },
  empty: { borderWidth: 1, borderColor: '#E7EAF0', borderRadius: 20, backgroundColor: '#FFFFFF', paddingVertical: 58, alignItems: 'center' },
  emptyIcon: { color: '#8B5CF6', fontSize: 38 },
  emptyTitle: { color: '#172033', fontSize: 17, fontWeight: '800', marginTop: 8 },
  emptyText: { color: '#7B8495', fontSize: 12, marginTop: 6 },
  details: { width: 285, borderLeftWidth: 1, borderLeftColor: '#E7EAF0', backgroundColor: '#FFFFFF', padding: 21 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  detailsTitle: { color: '#172033', fontSize: 16, fontWeight: '800' },
  detailsClose: { color: '#7B8495', fontSize: 24 },
  preview: { height: 174, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  previewIcon: { fontSize: 54, fontWeight: '800' },
  detailsName: { color: '#172033', fontSize: 15, lineHeight: 21, fontWeight: '800', marginTop: 17 },
  detailsKind: { color: '#7B8495', fontSize: 9, fontWeight: '800', letterSpacing: 1.3, marginTop: 5 },
  divider: { height: 1, backgroundColor: '#E7EAF0', marginVertical: 18 },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 13 },
  detailLabel: { color: '#7B8495', fontSize: 10 },
  detailValue: { color: '#172033', fontSize: 10, fontWeight: '600', textAlign: 'right' },
  detailsActions: { marginTop: 'auto', gap: 9 },
  mobileNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: Platform.OS === 'ios' ? 78 : 68, borderTopWidth: 1, borderTopColor: '#E7EAF0', backgroundColor: '#FFFFFF', flexDirection: 'row', paddingBottom: Platform.OS === 'ios' ? 10 : 0 },
  mobileNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  mobileNavIcon: { color: '#7B8495', fontSize: 18 },
  mobileNavText: { color: '#7B8495', fontSize: 8, fontWeight: '700' },
  mobileNavActive: { color: '#7C3AED' },
});
