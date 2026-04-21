/**
 * Mock SMS Service for Ngamia
 */
class SMSService {
  static templates = {
    en: {
      confirmation: (name, id, queue, time, total) => 
        `Hello ${name}, your order #${id} is confirmed. Queue: #${queue}. Pickup: ${time}. Total: ${total} RWF.`,
      reminder: (name, queue, time) => 
        `Reminder: ${name}, your pickup is at ${time}. Queue #${queue}. Please arrive on time.`,
      missed: (name, id) => 
        `Hello ${name}, you missed your pickup for order #${id}. Please contact admin.`
    },
    rw: {
      confirmation: (name, id, queue, time, total) => 
        `Muraho ${name}, commande yanyu #${id} yakiriwe. Umubare mu murongo: #${queue}. Muzaze kuyifata: ${time}. Igiciro: ${total} RWF.`,
      reminder: (name, queue, time) => 
        `Twabibutsa ${name}, igihe cyo gufata commande yanyu ni ${time}. Umubare #${queue}. Mwihute.`,
      missed: (name, id) => 
        `Muraho ${name}, ntimwabonetse igihe cyo gufata commande yanyu #${id}. Mwivugishe kuri admin.`
    },
    fr: {
      confirmation: (name, id, queue, time, total) => 
        `Bonjour ${name}, votre commande #${id} est confirmée. File: #${queue}. Retrait: ${time}. Total: ${total} RWF.`,
      reminder: (name, queue, time) => 
        `Rappel: ${name}, votre retrait est à ${time}. File #${queue}. Soyez à l'heure svp.`,
      missed: (name, id) => 
        `Bonjour ${name}, vous avez manqué le retrait pour la commande #${id}. Contactez l'admin.`
    }
  };

  static async sendSMS(phone, lang, type, data) {
    const template = this.templates[lang] || this.templates['en'];
    const message = template[type](...Object.values(data));
    
    console.log(`[SMS SEND] To: ${phone} | Lang: ${lang} | Message: ${message}`);
    // Integration with Twilio/Africa's Talking would go here
    return true;
  }
}

module.exports = SMSService;
