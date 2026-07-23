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
import { ZebecstarMark } from '../components/ZebecstarMark';
import { colors, fonts } from '../theme';

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
  folder: { icon: '▰', color: colors.amber700, background: '#F7EBD9' },
  document: { icon: '≡', color: colors.info, background: '#E8F2FD' },
  image: { icon: '◩', color: '#B55B70', background: '#F8E9EC' },
  sheet: { icon: '▦', color: '#247A4C', background: '#E4F1E8' },
  presentation: { icon: '▤', color: colors.amber600, background: '#F8E8D8' },
  archive: { icon: '▧', color: colors.forest500, background: colors.forest50 },
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
  const oneColumn = width < 430;
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
    setItems((current) => current.map((item) => (item.id === id ? { ...item, starred: !item.starred } : item)));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor={colors.forest900} />
      <View style={styles.shell}>
        {!mobile && (
          <View style={styles.sidebar}>
            <Brand />
            <Pressable style={({ pressed }) => [styles.newButton, pressed && styles.pressed]} onPress={addFolder}>
              <Text style={styles.newButtonText}>＋ NEW FOLDER</Text>
            </Pressable>

            <View style={styles.navList}>
              {nav.map((item) => {
                const active = section === item.label;
                return (
                  <Pressable
                    key={item.label}
                    onPress={() => setSection(item.label)}
                    style={({ pressed }) => [styles.navItem, active && styles.navActive, pressed && styles.navPressed]}
                  >
                    {active && <View style={styles.activeRail} />}
                    <Text style={[styles.navIcon, active && styles.navActiveText]}>{item.icon}</Text>
                    <Text style={[styles.navText, active && styles.navActiveText]}>{item.label.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.storageCard}>
              <View style={styles.storageHeader}>
                <Text style={styles.storageTitle}>STORAGE</Text>
                <Text style={styles.storagePercent}>24%</Text>
              </View>
              <View style={styles.storageTrack}><View style={styles.storageFill} /></View>
              <Text style={styles.storageCopy}>3.6 GB OF 15 GB USED</Text>
            </View>

            <View style={styles.profile}>
              <View style={styles.avatar}><Text style={styles.avatarText}>SH</Text></View>
              <View>
                <Text style={styles.profileName}>Saladi Haji</Text>
                <Text style={styles.profilePlan}>PERSONAL WORKSPACE</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.main}>
          <View style={[styles.topbar, mobile && styles.mobileTopbar]}>
            {mobile && <Brand compact />}
            <View style={[styles.searchBox, mobile && styles.mobileSearchBox]}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search files and folders"
                placeholderTextColor={colors.warm400}
                style={styles.searchInput}
              />
              {!!query && <Pressable onPress={() => setQuery('')}><Text style={styles.clear}>×</Text></Pressable>}
            </View>
            {!mobile && <View style={styles.helpButton}><Text style={styles.helpText}>?</Text></View>}
          </View>

          <ScrollView contentContainerStyle={[styles.content, mobile && styles.mobileContent]} showsVerticalScrollIndicator={false}>
            <View style={styles.heading}>
              <View>
                <Text style={styles.eyebrow}>UNIDAC WORKSPACE / DRIVE</Text>
                <Text style={styles.title}>{section.toUpperCase()}</Text>
                <Text style={styles.subtitle}>Keep every project organized and available on every device.</Text>
              </View>
              <View style={styles.actions}>
                <ActionButton label="NEW FOLDER" secondary onPress={addFolder} />
                <ActionButton label="UPLOAD FILES" onPress={upload} />
              </View>
            </View>

            {section === 'Home' && !query && (
              <View style={styles.hero}>
                <View style={styles.heroLineOne} />
                <View style={styles.heroLineTwo} />
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>UNIDAC DRIVE / ALPHA 01</Text>
                  <Text style={styles.heroTitle}>YOUR WORK, READY ACROSS EVERY DEVICE.</Text>
                  <Text style={styles.heroBody}>Continue from a recent file, upload new material, or open a clean project folder.</Text>
                  <View style={styles.heroActions}>
                    <Pressable style={({ pressed }) => [styles.heroPrimary, pressed && styles.pressed]} onPress={upload}>
                      <Text style={styles.heroPrimaryText}>UPLOAD SOMETHING</Text>
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.heroSecondary, pressed && styles.pressed]} onPress={addFolder}>
                      <Text style={styles.heroSecondaryText}>CREATE A FOLDER</Text>
                    </Pressable>
                  </View>
                </View>
                {!mobile && <View style={styles.heroMark}><ZebecstarMark size={205} color={colors.forest600} /></View>}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{query ? 'SEARCH RESULTS' : folders.length ? 'FOLDERS' : 'FILES'}</Text>
                <Text style={styles.count}>{visible.length.toString().padStart(2, '0')} ITEMS</Text>
              </View>
              <View style={styles.toggle}>
                <Pressable onPress={() => setGrid(true)} style={[styles.toggleButton, grid && styles.toggleActive]}>
                  <Text style={[styles.toggleText, grid && styles.toggleTextActive]}>▦</Text>
                </Pressable>
                <Pressable onPress={() => setGrid(false)} style={[styles.toggleButton, !grid && styles.toggleActive]}>
                  <Text style={[styles.toggleText, !grid && styles.toggleTextActive]}>☷</Text>
                </Pressable>
              </View>
            </View>

            {!visible.length ? (
              <View style={styles.empty}>
                <ZebecstarMark size={50} color={colors.amber600} />
                <Text style={styles.emptyTitle}>NOTHING HERE YET</Text>
                <Text style={styles.emptyText}>Try another search or add a new file.</Text>
              </View>
            ) : grid ? (
              <>
                <View style={styles.grid}>
                  {folders.map((item) => (
                    <Card key={item.id} item={item} active={selected === item.id} mobile={mobile} oneColumn={oneColumn} onPress={() => setSelected(item.id)} onStar={() => toggleStar(item.id)} />
                  ))}
                </View>
                {!!files.length && !!folders.length && <Text style={styles.filesHeading}>FILES</Text>}
                <View style={styles.grid}>
                  {files.map((item) => (
                    <Card key={item.id} item={item} active={selected === item.id} mobile={mobile} oneColumn={oneColumn} onPress={() => setSelected(item.id)} onStar={() => toggleStar(item.id)} />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.list}>
                {visible.map((item, index) => (
                  <Row key={item.id} item={item} active={selected === item.id} last={index === visible.length - 1} onPress={() => setSelected(item.id)} />
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        {showDetails && selectedItem && (
          <View style={styles.details}>
            <View style={styles.detailsHeader}><Text style={styles.detailsTitle}>DETAILS</Text><Text style={styles.detailsClose}>×</Text></View>
            <View style={[styles.preview, { backgroundColor: fileStyle[selectedItem.kind].background }]}>
              <Text style={[styles.previewIcon, { color: fileStyle[selectedItem.kind].color }]}>{fileStyle[selectedItem.kind].icon}</Text>
            </View>
            <Text style={styles.detailsName}>{selectedItem.name}</Text>
            <Text style={styles.detailsKind}>{selectedItem.kind.toUpperCase()}</Text>
            <View style={styles.divider} />
            <Detail label="OWNER" value={selectedItem.owner} />
            <Detail label="MODIFIED" value={selectedItem.updated} />
            <Detail label="SIZE" value={selectedItem.size} />
            <Detail label="ACCESS" value={selectedItem.shared ? 'Shared' : 'Only you'} />
            <View style={styles.detailsActions}>
              <ActionButton label="OPEN" onPress={() => undefined} />
              <ActionButton label={selectedItem.starred ? 'REMOVE STAR' : 'ADD STAR'} secondary onPress={() => toggleStar(selectedItem.id)} />
            </View>
          </View>
        )}
      </View>

      {mobile && (
        <View style={styles.mobileNav}>
          {nav.slice(0, 5).map((item) => {
            const active = section === item.label;
            return (
              <Pressable key={item.label} style={styles.mobileNavItem} onPress={() => setSection(item.label)}>
                <Text style={[styles.mobileNavIcon, active && styles.mobileNavActive]}>{item.icon}</Text>
                <Text style={[styles.mobileNavText, active && styles.mobileNavActive]}>{item.label === 'My Drive' ? 'DRIVE' : item.label.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.brandRow, compact && styles.compactBrand]}>
      <View style={styles.logoTile}><ZebecstarMark size={compact ? 29 : 33} /></View>
      <View>
        <Text style={[styles.brand, compact && styles.compactBrandName]}>UNIDAC</Text>
        <Text style={styles.product}>{compact ? 'DRIVE' : 'DRIVE · ZEBECSTAR'}</Text>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return (
    <Pressable style={({ pressed }) => [secondary ? styles.secondaryButton : styles.primaryButton, pressed && styles.pressed]} onPress={onPress}>
      <Text style={secondary ? styles.secondaryText : styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function Card({ item, active, mobile, oneColumn, onPress, onStar }: { item: Item; active: boolean; mobile: boolean; oneColumn: boolean; onPress: () => void; onStar: () => void }) {
  const meta = fileStyle[item.kind];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, mobile && styles.mobileCard, oneColumn && styles.oneColumnCard, active && styles.cardActive, pressed && styles.cardPressed]}>
      <View style={styles.cardTop}>
        <View style={[styles.fileIcon, { backgroundColor: meta.background }]}><Text style={[styles.fileGlyph, { color: meta.color }]}>{meta.icon}</Text></View>
        <Pressable onPress={onStar} hitSlop={10}><Text style={[styles.star, item.starred && styles.starred]}>{item.starred ? '★' : '☆'}</Text></Pressable>
      </View>
      <Text style={styles.fileName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.metaRow}><Text style={styles.meta}>{item.updated.toUpperCase()}</Text><Text style={styles.meta}>{item.size.toUpperCase()}</Text></View>
      {item.shared && <View style={styles.shared}><Text style={styles.sharedText}>SHARED</Text></View>}
    </Pressable>
  );
}

function Row({ item, active, last, onPress }: { item: Item; active: boolean; last: boolean; onPress: () => void }) {
  const meta = fileStyle[item.kind];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, active && styles.rowActive, last && styles.lastRow, pressed && styles.cardPressed]}>
      <View style={[styles.rowIcon, { backgroundColor: meta.background }]}><Text style={[styles.rowGlyph, { color: meta.color }]}>{meta.icon}</Text></View>
      <View style={styles.rowCopy}><Text style={styles.rowName}>{item.name}</Text><Text style={styles.rowMeta}>{item.owner.toUpperCase()} · {item.updated.toUpperCase()}</Text></View>
      <Text style={styles.rowSize}>{item.size.toUpperCase()}</Text>
    </Pressable>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailLine}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.forest900 },
  shell: { flex: 1, flexDirection: 'row', backgroundColor: colors.warm0 },
  sidebar: { width: 258, backgroundColor: colors.forest900, padding: 18, paddingTop: 24, borderRightWidth: 1, borderRightColor: colors.forest700 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, marginBottom: 30 },
  compactBrand: { width: '100%', marginBottom: 2, paddingHorizontal: 0 },
  logoTile: { width: 43, height: 43, borderRadius: 9, borderWidth: 1, borderColor: colors.forest600, backgroundColor: colors.forest850, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.forest50, fontSize: 17, lineHeight: 20, fontFamily: fonts.displayBold, letterSpacing: 0.8 },
  compactBrandName: { color: colors.warm950, fontSize: 14, lineHeight: 17 },
  product: { color: colors.forest300, fontSize: 8, fontFamily: fonts.uiBold, letterSpacing: 1.6, marginTop: 2 },
  newButton: { height: 46, borderRadius: 8, backgroundColor: colors.amber400, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  newButtonText: { color: colors.forest1000, fontSize: 12, fontFamily: fonts.uiBold, letterSpacing: 0.9 },
  pressed: { opacity: 0.76 },
  navList: { gap: 4 },
  navItem: { height: 44, borderRadius: 7, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 12, overflow: 'hidden' },
  navActive: { backgroundColor: colors.forest800 },
  navPressed: { backgroundColor: colors.forest850 },
  activeRail: { position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, backgroundColor: colors.amber400 },
  navIcon: { color: colors.forest400, width: 21, textAlign: 'center', fontSize: 17, fontFamily: fonts.uiBold },
  navText: { color: colors.forest300, fontSize: 12, fontFamily: fonts.uiSemiBold, letterSpacing: 0.75 },
  navActiveText: { color: colors.forest50 },
  storageCard: { marginTop: 'auto', backgroundColor: colors.forest850, borderWidth: 1, borderColor: colors.forest700, borderRadius: 10, padding: 14 },
  storageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  storageTitle: { color: colors.forest100, fontSize: 11, fontFamily: fonts.uiBold, letterSpacing: 0.8 },
  storagePercent: { color: colors.amber300, fontSize: 11, fontFamily: fonts.monoBold },
  storageTrack: { height: 5, borderRadius: 5, backgroundColor: colors.forest700, overflow: 'hidden' },
  storageFill: { width: '24%', height: '100%', backgroundColor: colors.amber400 },
  storageCopy: { color: colors.forest400, fontSize: 8, fontFamily: fonts.mono, marginTop: 9 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, paddingHorizontal: 3 },
  avatar: { width: 35, height: 35, borderRadius: 7, backgroundColor: colors.warm50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.amber700, fontSize: 10, fontFamily: fonts.uiBold },
  profileName: { color: colors.forest50, fontSize: 12, fontFamily: fonts.bodySemiBold },
  profilePlan: { color: colors.forest400, fontSize: 8, fontFamily: fonts.uiBold, letterSpacing: 0.45, marginTop: 2 },
  main: { flex: 1, minWidth: 0, backgroundColor: colors.warm0 },
  topbar: { minHeight: 74, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.warm200, backgroundColor: colors.surface },
  mobileTopbar: { minHeight: 118, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16, flexWrap: 'wrap', alignItems: 'center' },
  searchBox: { flex: 1, maxWidth: 700, height: 44, borderRadius: 8, borderWidth: 1, borderColor: colors.warm200, backgroundColor: colors.warm50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  mobileSearchBox: { width: '100%', maxWidth: '100%' },
  searchIcon: { color: colors.warm500, fontSize: 21, marginRight: 8, fontFamily: fonts.uiBold },
  searchInput: { flex: 1, color: colors.warm950, fontSize: 13, fontFamily: fonts.body },
  clear: { color: colors.warm500, fontSize: 22, fontFamily: fonts.uiBold },
  helpButton: { width: 42, height: 42, borderRadius: 8, borderWidth: 1, borderColor: colors.warm200, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  helpText: { color: colors.warm950, fontFamily: fonts.uiBold },
  content: { paddingHorizontal: 28, paddingBottom: 44 },
  mobileContent: { paddingHorizontal: 16, paddingBottom: 100 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 18, marginTop: 24, marginBottom: 24, flexWrap: 'wrap' },
  eyebrow: { color: colors.amber700, fontSize: 9, fontFamily: fonts.uiBold, letterSpacing: 1.7, marginBottom: 7 },
  title: { color: colors.warm950, fontSize: 31, lineHeight: 38, fontFamily: fonts.displayBold, letterSpacing: -0.4 },
  subtitle: { color: colors.warm500, fontSize: 13, fontFamily: fonts.body, marginTop: 7 },
  actions: { flexDirection: 'row', gap: 9, flexWrap: 'wrap' },
  primaryButton: { height: 42, paddingHorizontal: 17, borderRadius: 8, backgroundColor: colors.amber400, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.forest1000, fontSize: 11, fontFamily: fonts.uiBold, letterSpacing: 0.8 },
  secondaryButton: { height: 42, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.warm200, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.warm950, fontSize: 11, fontFamily: fonts.uiBold, letterSpacing: 0.75 },
  hero: { minHeight: 230, borderRadius: 14, borderWidth: 1, borderColor: colors.forest700, backgroundColor: colors.forest900, overflow: 'hidden', flexDirection: 'row', padding: 30, marginBottom: 31 },
  heroLineOne: { position: 'absolute', left: '58%', top: -80, width: 1, height: 430, backgroundColor: colors.forest700, transform: [{ rotate: '23deg' }] },
  heroLineTwo: { position: 'absolute', left: '72%', top: -80, width: 1, height: 430, backgroundColor: colors.forest700, transform: [{ rotate: '23deg' }] },
  heroCopy: { flex: 1, maxWidth: 620, zIndex: 2 },
  heroEyebrow: { color: colors.amber300, fontSize: 9, fontFamily: fonts.monoBold, letterSpacing: 1.35, marginBottom: 12 },
  heroTitle: { color: colors.forest50, fontSize: 26, lineHeight: 34, fontFamily: fonts.displayBold, letterSpacing: -0.25, maxWidth: 570 },
  heroBody: { color: colors.forest300, fontSize: 13, lineHeight: 21, fontFamily: fonts.body, marginTop: 11, maxWidth: 500 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 22, flexWrap: 'wrap' },
  heroPrimary: { height: 40, borderRadius: 8, backgroundColor: colors.amber400, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  heroPrimaryText: { color: colors.forest1000, fontSize: 10, fontFamily: fonts.uiBold, letterSpacing: 0.75 },
  heroSecondary: { height: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.forest600, backgroundColor: colors.forest850, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  heroSecondaryText: { color: colors.forest50, fontSize: 10, fontFamily: fonts.uiBold, letterSpacing: 0.75 },
  heroMark: { width: 245, alignItems: 'center', justifyContent: 'center', opacity: 0.65, zIndex: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { color: colors.warm950, fontSize: 17, fontFamily: fonts.uiBold, letterSpacing: 0.8 },
  count: { color: colors.warm500, fontSize: 9, fontFamily: fonts.mono, marginTop: 3 },
  toggle: { flexDirection: 'row', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: colors.warm200, backgroundColor: colors.surface },
  toggleButton: { width: 34, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  toggleActive: { backgroundColor: colors.forest800 },
  toggleText: { color: colors.warm500, fontSize: 15, fontFamily: fonts.uiBold },
  toggleTextActive: { color: colors.amber300 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  card: { width: 210, minHeight: 158, borderRadius: 10, borderWidth: 1, borderColor: colors.warm200, backgroundColor: colors.surface, padding: 15 },
  mobileCard: { width: '48.1%', minWidth: 148 },
  oneColumnCard: { width: '100%' },
  cardActive: { borderColor: colors.amber500, borderWidth: 2, padding: 14 },
  cardPressed: { opacity: 0.76 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  fileIcon: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fileGlyph: { fontSize: 20, fontFamily: fonts.uiBold },
  star: { color: colors.warm300, fontSize: 20, fontFamily: fonts.uiBold },
  starred: { color: colors.amber500 },
  fileName: { color: colors.warm950, fontSize: 13, fontFamily: fonts.bodySemiBold, lineHeight: 18, marginTop: 14, minHeight: 36 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 8 },
  meta: { color: colors.warm500, fontSize: 8, fontFamily: fonts.mono },
  shared: { position: 'absolute', right: 12, bottom: 12, borderRadius: 5, backgroundColor: '#F5E6CF', paddingHorizontal: 7, paddingVertical: 3 },
  sharedText: { color: colors.amber700, fontSize: 7, fontFamily: fonts.uiBold, letterSpacing: 0.5 },
  filesHeading: { color: colors.warm950, fontSize: 17, fontFamily: fonts.uiBold, letterSpacing: 0.8, marginTop: 28, marginBottom: 14 },
  list: { borderWidth: 1, borderColor: colors.warm200, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface },
  row: { minHeight: 68, borderBottomWidth: 1, borderBottomColor: colors.warm200, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  rowActive: { backgroundColor: '#F7EBD9' },
  lastRow: { borderBottomWidth: 0 },
  rowIcon: { width: 36, height: 36, borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  rowGlyph: { fontSize: 17, fontFamily: fonts.uiBold },
  rowCopy: { flex: 1, minWidth: 0 },
  rowName: { color: colors.warm950, fontSize: 12, fontFamily: fonts.bodySemiBold },
  rowMeta: { color: colors.warm500, fontSize: 8, fontFamily: fonts.mono, marginTop: 4 },
  rowSize: { color: colors.warm500, fontSize: 9, fontFamily: fonts.mono },
  empty: { borderWidth: 1, borderColor: colors.warm200, borderRadius: 12, backgroundColor: colors.surface, paddingVertical: 58, alignItems: 'center' },
  emptyTitle: { color: colors.warm950, fontSize: 16, fontFamily: fonts.uiBold, letterSpacing: 0.75, marginTop: 11 },
  emptyText: { color: colors.warm500, fontSize: 12, fontFamily: fonts.body, marginTop: 6 },
  details: { width: 290, borderLeftWidth: 1, borderLeftColor: colors.warm200, backgroundColor: colors.surface, padding: 21 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  detailsTitle: { color: colors.warm950, fontSize: 14, fontFamily: fonts.uiBold, letterSpacing: 0.9 },
  detailsClose: { color: colors.warm500, fontSize: 24, fontFamily: fonts.ui },
  preview: { height: 174, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  previewIcon: { fontSize: 54, fontFamily: fonts.uiBold },
  detailsName: { color: colors.warm950, fontSize: 15, lineHeight: 21, fontFamily: fonts.bodyBold, marginTop: 17 },
  detailsKind: { color: colors.amber700, fontSize: 8, fontFamily: fonts.monoBold, letterSpacing: 1.2, marginTop: 5 },
  divider: { height: 1, backgroundColor: colors.warm200, marginVertical: 18 },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 13 },
  detailLabel: { color: colors.warm500, fontSize: 8, fontFamily: fonts.mono },
  detailValue: { color: colors.warm950, fontSize: 10, fontFamily: fonts.bodySemiBold, textAlign: 'right' },
  detailsActions: { marginTop: 'auto', gap: 9 },
  mobileNav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: Platform.OS === 'ios' ? 80 : 68, borderTopWidth: 1, borderTopColor: colors.forest700, backgroundColor: colors.forest900, flexDirection: 'row', paddingBottom: Platform.OS === 'ios' ? 10 : 0 },
  mobileNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  mobileNavIcon: { color: colors.forest400, fontSize: 18, fontFamily: fonts.uiBold },
  mobileNavText: { color: colors.forest400, fontSize: 7, fontFamily: fonts.uiBold, letterSpacing: 0.4 },
  mobileNavActive: { color: colors.amber300 },
});
