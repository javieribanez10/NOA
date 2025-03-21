export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    company: string;
    sector: string;
    location: string;
    interestedProduct: string;
    leadType: 'Caliente' | 'Tibio' | 'Frío';
    channel: string;
    firstContact: string;
    lastContact: string;
    leadSource: string;
    conversations: number;
    avgResponseTime: string;
    status: 'Completado' | 'En proceso' | 'Perdido' | 'Fuga';
  }
  