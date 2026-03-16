export function getStatusColor(statusLabel: string): string {
    switch (statusLabel) {
      case 'Livraison expirée': return 'bg-amber-500/20 text-amber-500 border-amber-500/40'
      case 'En transit': return 'bg-primary/10 text-primary border-primary/20'
      case 'Chargement': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'En attente': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'Retardé': return 'bg-danger/10 text-danger border-danger/20'
      case 'Terminée': return 'bg-primary/10 text-primary border-primary/20'
      case 'Annulée': return 'bg-gray-500/10 text-gray-500'
      
      default: return 'bg-gray-500/10 text-gray-500'
    }
  }
  
  