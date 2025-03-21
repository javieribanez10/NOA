import axios from 'axios';
import { Customer } from '../../types/customer';

export const fetchLeads = async (): Promise<Customer[]> => {
  // Se utiliza '/api/v1/leads/' para que coincida con la ruta completa del endpoint en el backend.
  const response = await axios.get<Customer[]>('/api/v1/leads/');
  return response.data;
};
