import React, { useState, useEffect, useCallback } from 'react';
import { StoreSettings, Item, StockMovement, Customer, Supplier, Quote, Invoice } from '../types';
import {
  isFirebaseAvailable,
  saveBackupToCloud,
  getBackupsFromCloud,
  deleteBackupFromCloud,
  CloudBackup
} from '../lib/firebase';
import { toast } from 'sonner';

export interface CloudBackupData {
  settings: StoreSettings;
  items: Item[];
  movements: StockMovement[];
  customers: Customer[];
  suppliers: Supplier[];
  quotes: Quote[];
  invoices: Invoice[];
}

export function useCloudBackups(
  data: CloudBackupData,
  onRestoreAllData: (data: CloudBackupData) => void
) {
  const [backups, setBackups] = useState<CloudBackup[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupLabel, setBackupLabel] = useState('');
  const [backupOperator, setBackupOperator] = useState('Abdou');
  const [cloudStatusMsg, setCloudStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadBackupsList = useCallback(async () => {
    if (!isFirebaseAvailable) return;
    setIsFetching(true);
    try {
      const list = await getBackupsFromCloud();
      setBackups(list);
    } catch (err) {
      console.error("Failed to load backups:", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    loadBackupsList();
  }, [loadBackupsList]);

  const handleCreateBackup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseAvailable) {
      setCloudStatusMsg({ type: 'error', text: "Le service Cloud n'est pas disponible." });
      return;
    }
    if (!backupLabel.trim()) {
      toast.error("Veuillez donner une description à votre sauvegarde.");
      return;
    }

    setIsBackingUp(true);
    setCloudStatusMsg(null);

    try {
      const dataPackage = {
        settings: data.settings,
        items: data.items,
        movements: data.movements,
        customers: data.customers,
        suppliers: data.suppliers,
        quotes: data.quotes,
        invoices: data.invoices
      };

      const backupId = await saveBackupToCloud(backupLabel, backupOperator, dataPackage);
      setCloudStatusMsg({
        type: 'success',
        text: `Sauvegarde Cloud "${backupLabel}" créée avec succès (ID: ${backupId.slice(0, 8)}...)`
      });
      setBackupLabel('');
      await loadBackupsList();
    } catch (err: any) {
      console.error(err);
      setCloudStatusMsg({ type: 'error', text: err.message || "Erreur lors de la sauvegarde." });
    } finally {
      setIsBackingUp(false);
    }
  }, [backupLabel, backupOperator, data, loadBackupsList]);

  const handleRestoreBackup = useCallback((backup: CloudBackup) => {
    const confirmation = window.confirm(
      `ATTENTION: Vous êtes sur le point de restaurer la sauvegarde "${backup.label}" du ${new Date(backup.createdAt).toLocaleString('fr-FR')}.\n\nCela va ÉCRASER toutes vos données locales actuelles (stocks, clients, factures, devis, etc.). Cette opération est irréversible.\n\nVoulez-vous continuer ?`
    );

    if (!confirmation) return;

    try {
      const unpacked = backup.data;
      if (!unpacked) {
        toast.error("La sauvegarde semble vide ou corrompue.");
        return;
      }

      onRestoreAllData({
        settings: unpacked.settings || data.settings,
        items: unpacked.items || [],
        movements: unpacked.movements || [],
        customers: unpacked.customers || [],
        suppliers: unpacked.suppliers || [],
        quotes: unpacked.quotes || [],
        invoices: unpacked.invoices || []
      });

      setCloudStatusMsg({
        type: 'success',
        text: `Restauration effectuée avec succès ! Les données du ${new Date(backup.createdAt).toLocaleDateString('fr-FR')} sont restaurées.`
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur critique lors du chargement des données restaurées.");
    }
  }, [data.settings, onRestoreAllData]);

  const handleDeleteBackup = useCallback(async (id: string, label: string) => {
    const confirmation = window.confirm(`Supprimer définitivement la sauvegarde "${label}" du Cloud ?`);
    if (!confirmation) return;

    try {
      await deleteBackupFromCloud(id);
      setCloudStatusMsg({ type: 'success', text: "Sauvegarde supprimée du Cloud." });
      await loadBackupsList();
    } catch (err: any) {
      console.error(err);
      setCloudStatusMsg({ type: 'error', text: err.message || "Impossible de supprimer la sauvegarde." });
    }
  }, [loadBackupsList]);

  return {
    backups,
    isBackingUp,
    isFetching,
    cloudStatusMsg,
    backupLabel,
    backupOperator,
    setBackupLabel,
    setBackupOperator,
    handleCreateBackup,
    handleRestoreBackup,
    handleDeleteBackup,
    loadBackupsList
  };
}
