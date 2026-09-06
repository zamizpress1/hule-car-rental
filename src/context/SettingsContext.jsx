import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    commissionPercentage: 10,
    brokerPhone: '+251 911 000 000',
    telegramHandle: '@fetandrive_admin',
    moderationMode: 'manual'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('id, commission_percentage, broker_phone, telegram_handle, moderation_mode')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Supabase settings fetch error:', error.message);
        } else if (data) {
          setSettings({
            id: data.id,
            commissionPercentage: data.commission_percentage ?? 10,
            brokerPhone: data.broker_phone ?? '+251 911 000 000',
            telegramHandle: data.telegram_handle ?? '@HuleCars_admin',
            moderationMode: data.moderation_mode ?? 'manual'
          });
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    const dbPayload = {
      commission_percentage: Number(newSettings.commissionPercentage),
      broker_phone: newSettings.brokerPhone,
      telegram_handle: newSettings.telegramHandle,
      moderation_mode: newSettings.moderationMode,
      updated_at: new Date().toISOString()
    };

    try {
      let error;
      if (settings.id) {
        const res = await supabase.from('platform_settings').update(dbPayload).eq('id', settings.id);
        error = res.error;
      } else {
        const res = await supabase.from('platform_settings').insert([dbPayload]);
        error = res.error;
      }

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error updating settings:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
