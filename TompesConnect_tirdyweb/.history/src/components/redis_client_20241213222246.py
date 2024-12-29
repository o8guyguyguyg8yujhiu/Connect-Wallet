import redis
import json

class WalletData:
    def __init__(self, host='localhost', port=6379, db=0, decode_responses=True):
        self.client = redis.StrictRedis(host=host, port=port, db=db, decode_responses=decode_responses)

    def get_all_wallets(self):
        """
        Получает все связи user_id ↔ wallet_address.
        :return: Список словарей с user_id и wallet_address
        """
        try:
            keys = self.client.keys("user_wallet:*")
            wallets = [
                {"user_id": key.split(":")[1], "wallet_address": self.client.get(key)}
                for key in keys
            ]
            print(f"Wallets found: {json.dumps(wallets, indent=2)}")
            return wallets
        except Exception as e:
            print(f"Error fetching wallets: {e}")
            return []

    def get_wallet_by_user_id(self, user_id):
        """
        Получает кошелёк по user_id.
        :param user_id: Идентификатор пользователя
        :return: Адрес кошелька или None, если запись не найдена
        """
        try:
            wallet_address = self.client.get(f"user_wallet:{user_id}")
            if wallet_address:
                print(f"Wallet for user_id {user_id}: {wallet_address}")
                return wallet_address
            else:
                print(f"No wallet found for user_id {user_id}")
                return None
        except Exception as e:
            print(f"Error fetching wallet for user_id {user_id}: {e}")
            return None

    def delete_wallet_by_user_id(self, user_id):
        """
        Удаляет запись о кошельке по user_id.
        :param user_id: Идентификатор пользователя
        """
        try:
            result = self.client.delete(f"user_wallet:{user_id}")
            if result:
                print(f"Deleted wallet for user_id {user_id}")
            else:
                print(f"No wallet found to delete for user_id {user_id}")
        except Exception as e:
            print(f"Error deleting wallet for user_id {user_id}: {e}")

# Пример использования
if __name__ == "__main__":
    wallet_data = WalletData()

    # Получить все кошельки
    wallets = wallet_data.get_all_wallets()

    # Получить кошелёк по user_id
    user_wallet = wallet_data.get_wallet_by_user_id("5893785541")

    # Удалить кошелёк по user_id
    wallet_data.delete_wallet_by_user_id("1")
