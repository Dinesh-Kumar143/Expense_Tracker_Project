import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EMOJI_CHOICES } from '../constants';
import OverlayModule from '../modules/OverlayModule';
import {
  addCategory,
  deleteCategory,
  updateSettings,
} from '../storage';
import { borderRadius, colors, spacing, typography } from '../theme';
import { AppData, Category } from '../types';
import { createId, nextPalette } from '../utils';
import Logger from '../logging/Logger';

type Props = {
  appData: AppData;
  onUpdate: (data: AppData) => void;
  onBack: () => void;
};

export function SettingsScreen({ appData, onUpdate, onBack }: Props) {
  const [addModalVisible, setAddModalVisible] = useState(false);

  async function handleDeleteCategory(category: Category) {
    // Check if category is default
    if (category.isDefault) {
      Alert.alert(
        'Cannot delete',
        'This is a default category and cannot be deleted.',
      );
      return;
    }

    // Check if category has expenses
    const hasExpenses = appData.expenses.some(
      (expense) => expense.categoryId === category.id,
    );

    if (hasExpenses) {
      // Count expenses
      const expenseCount = appData.expenses.filter(
        (expense) => expense.categoryId === category.id,
      ).length;

      Alert.alert(
        'Category has expenses',
        `This category has ${expenseCount} expense(s). Delete anyway? All expenses will be moved to "Other" category.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => confirmDelete(category),
          },
        ],
      );
    } else {
      Alert.alert(
        'Delete category',
        `Delete "${category.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => confirmDelete(category),
          },
        ],
      );
    }
  }

  async function confirmDelete(category: Category) {
    try {
      // Find "Other" category as fallback
      const otherCategory = appData.categories.find(
        (cat) => cat.name.toLowerCase() === 'other',
      );

      if (!otherCategory) {
        Alert.alert('Error', 'Cannot find fallback category.');
        return;
      }

      const updated = await deleteCategory(
        appData,
        category.id,
        otherCategory.id,
      );
      onUpdate(updated);

      Logger.logUserAction('Delete Category', 'Settings', {
        categoryId: category.id,
        categoryName: category.name,
        movedToCategory: otherCategory.id,
      });
    } catch (error) {
      Alert.alert('Error', String(error));
      Logger.logError('Failed to delete category', error as Error, {
        categoryId: category.id,
      });
    }
  }

  async function handleToggleOverlay(value: boolean) {
    Logger.logUserAction('Toggle Overlay', 'Settings', {
      enabled: value,
    });

    // Check if native module is available
    if (!OverlayModule.isModuleAvailable()) {
      Alert.alert(
        'Feature Not Available',
        'The floating button feature requires native Android code.\n\n' +
        'To enable this feature:\n' +
        '1. Run "npx expo prebuild" to generate native Android code\n' +
        '2. Add the native overlay module (see NATIVE_IMPLEMENTATION.md)\n' +
        '3. Build with "npx expo run:android"\n\n' +
        'This is a complex feature requiring native Android development.',
        [{ text: 'OK' }],
      );
      return;
    }

    try {
      if (value) {
        // User wants to enable overlay
        const hasPermission = await OverlayModule.checkOverlayPermission();

        if (!hasPermission) {
          // Request permission
          Alert.alert(
            'Permission Required',
            'The floating button needs permission to display over other apps.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Grant Permission',
                onPress: async () => {
                  const granted = await OverlayModule.requestOverlayPermission();
                  if (granted) {
                    // Wait for user to grant permission and return
                    setTimeout(async () => {
                      const checkAgain = await OverlayModule.checkOverlayPermission();
                      if (checkAgain) {
                        // Start service
                        const started = await OverlayModule.startOverlayService();
                        if (started) {
                          const updated = await updateSettings(appData, {
                            overlayEnabled: true,
                          });
                          onUpdate(updated);
                          Logger.logUserAction('Overlay Enabled', 'Settings', {
                            success: true,
                          });
                        }
                      } else {
                        Alert.alert(
                          'Permission Denied',
                          'The floating button feature requires overlay permission.',
                        );
                        Logger.logUserAction('Overlay Permission Denied', 'Settings');
                      }
                    }, 2000);
                  }
                },
              },
            ],
          );
          return;
        }

        // Permission already granted, start service
        const started = await OverlayModule.startOverlayService();
        if (started) {
          const updated = await updateSettings(appData, { overlayEnabled: true });
          onUpdate(updated);
          Alert.alert(
            'Floating Button Enabled',
            'The quick-add button is now available system-wide. Tap it to quickly log expenses from any app.',
          );
          Logger.logUserAction('Overlay Enabled', 'Settings', {
            success: true,
          });
        }
      } else {
        // User wants to disable overlay
        await OverlayModule.stopOverlayService();
        const updated = await updateSettings(appData, { overlayEnabled: false });
        onUpdate(updated);
        Logger.logUserAction('Overlay Disabled', 'Settings');
      }
    } catch (error) {
      Alert.alert('Error', String(error));
      Logger.logError('Failed to toggle overlay', error as Error, {
        action: value ? 'enable' : 'disable',
      });
    }
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.heading}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Section 1: Category Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.sectionSubtitle}>
              Manage your spending categories
            </Text>
          </View>

          <View style={styles.categoryList}>
            {appData.categories.map((category) => (
              <View key={category.id} style={styles.categoryItem}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.tint },
                  ]}
                >
                  <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                </View>
                <View style={styles.categoryMeta}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.isDefault && (
                    <Text style={styles.categoryBadge}>Default</Text>
                  )}
                </View>
                <Pressable
                  style={[
                    styles.deleteButton,
                    category.isDefault && styles.deleteButtonDisabled,
                  ]}
                  onPress={() => handleDeleteCategory(category)}
                  disabled={category.isDefault}
                >
                  <Text
                    style={[
                      styles.deleteButtonText,
                      category.isDefault && styles.deleteButtonTextDisabled,
                    ]}
                  >
                    🗑️
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.addCategoryButton}
            onPress={() => setAddModalVisible(true)}
          >
            <Text style={styles.addCategoryButtonText}>+ Add Category</Text>
          </Pressable>
        </View>

        {/* Section 2: Android Floating Button */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Add Widget</Text>
            <Text style={styles.sectionSubtitle}>
              Enable floating button for system-wide quick expense entry
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                Enable Floating Button
              </Text>
              <Text style={styles.settingHint}>
                {OverlayModule.isModuleAvailable()
                  ? 'Quick-add expenses from anywhere on your device'
                  : 'Requires native Android module (see docs)'}
              </Text>
            </View>
            <Switch
              value={appData.settings.overlayEnabled}
              onValueChange={handleToggleOverlay}
              trackColor={{ false: colors.border, true: colors.accentSoft }}
              thumbColor={
                appData.settings.overlayEnabled ? colors.accent : colors.surface
              }
            />
          </View>
        </View>

        {/* Section 3: About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>About</Text>
          </View>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>Expense Tracker</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutHint}>
              All data stored locally on your device
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <AddCategoryModal
        visible={addModalVisible}
        existingCategories={appData.categories}
        onClose={() => setAddModalVisible(false)}
        onAdd={async (name, emoji) => {
          try {
            const nextIndex = appData.categories.length;
            const palette = nextPalette(nextIndex);

            const newCategory: Category = {
              id: createId('cat'),
              name,
              ...palette,
              emoji,
              isDefault: false,
            };

            const updated = await addCategory(appData, newCategory);
            onUpdate(updated);
            setAddModalVisible(false);

            Logger.logUserAction('Add Category', 'Settings', {
              categoryId: newCategory.id,
              categoryName: name,
              emoji,
            });
          } catch (error) {
            Alert.alert('Error', String(error));
            Logger.logError('Failed to add category', error as Error, {
              categoryName: name,
            });
          }
        }}
      />
    </View>
  );
}

// ============================================
// ADD CATEGORY MODAL
// ============================================

type AddCategoryModalProps = {
  visible: boolean;
  existingCategories: Category[];
  onClose: () => void;
  onAdd: (name: string, emoji: string) => void;
};

function AddCategoryModal({
  visible,
  existingCategories,
  onClose,
  onAdd,
}: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_CHOICES[0]);

  function handleAdd() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Missing name', 'Please enter a category name.');
      return;
    }

    if (trimmedName.length > 20) {
      Alert.alert('Name too long', 'Keep the category name under 20 characters.');
      return;
    }

    // Check for duplicate names
    const duplicate = existingCategories.find(
      (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (duplicate) {
      Alert.alert('Duplicate', `Category "${trimmedName}" already exists.`);
      return;
    }

    onAdd(trimmedName, selectedEmoji);
    setName('');
    setSelectedEmoji(EMOJI_CHOICES[0]);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Category</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.modalClose}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Rent, Gym, Subscriptions"
              placeholderTextColor={colors.textMuted}
              style={styles.modalInput}
              maxLength={20}
              autoFocus
            />

            <Text style={styles.modalLabel}>Choose Icon</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_CHOICES.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    selectedEmoji === emoji && styles.emojiButtonSelected,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.modalSave, !name.trim() && styles.modalSaveDisabled]}
              onPress={handleAdd}
              disabled={!name.trim()}
            >
              <Text style={styles.modalSaveText}>Add Category</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.huge,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.accent,
  },
  heading: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.text,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl + spacing.lg,
    gap: spacing.xxl,
  },

  // Section Styles
  section: {
    gap: spacing.lg,
  },
  sectionHeader: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSizes.sm * typography.lineHeights.relaxed,
  },

  // Category List
  categoryList: {
    gap: spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  categoryName: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  categoryBadge: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  deleteButtonDisabled: {
    backgroundColor: colors.background,
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  deleteButtonTextDisabled: {
    opacity: 0.3,
  },
  addCategoryButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addCategoryButtonText: {
    color: colors.textOnAccent,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.extrabold,
  },

  // Settings Row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    gap: spacing.xs,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  settingHint: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSizes.sm * typography.lineHeights.normal,
  },

  // About Section
  aboutCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aboutText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  aboutVersion: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  aboutHint: {
    marginTop: spacing.xs,
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.extrabold,
    color: colors.text,
  },
  modalClose: {
    fontSize: typography.fontSizes.xxl,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  modalContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    fontSize: typography.fontSizes.md,
    color: colors.text,
    fontWeight: typography.fontWeights.medium,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  emojiText: {
    fontSize: 28,
  },
  modalSave: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  modalSaveDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
  },
  modalSaveText: {
    color: colors.textOnAccent,
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.extrabold,
  },
});
