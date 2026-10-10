import { memo, type ReactNode } from 'react';
import { Modal as RNModal, StyleSheet, View } from 'react-native';

import { radius, shadows, spacing, useColors } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/** Centred confirmation dialog on a dimmed backdrop. */
export const ConfirmModal = memo(function ConfirmModal({ visible, title, message, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onCancel, children }: ConfirmModalProps) {
  const c = useColors();
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.box, shadows.lg, { backgroundColor: c.surface, borderColor: c.border }]} accessibilityViewIsModal>
          <AppText variant="title" center accessibilityRole="header">
            {title}
          </AppText>
          <AppText center muted style={styles.message}>
            {message}
          </AppText>
          {children}
          <View style={styles.actions}>
            <Button label={cancelLabel} variant="secondary" onPress={onCancel} style={styles.flex} testID="modal-cancel" />
            <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} style={styles.flex} testID="modal-confirm" />
          </View>
        </View>
      </View>
    </RNModal>
  );
});

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(31,42,68,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  box: { width: '100%', maxWidth: 420, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1.5 },
  message: { marginTop: spacing.sm, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  flex: { flex: 1 },
});
