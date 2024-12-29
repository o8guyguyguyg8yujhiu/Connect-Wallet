import redis
import json

class WalletData:
    def __init__(self, host='localhost', port=6379, db=0, decode_responses=True):
        self.client = redis.StrictRedis(host=host, port=port, db=db, decode_responses=decode_responses)

    def add_wallet(self, user_id, wallet_address):
        """
        Добавляет или обновляет запись о кошельке для user_id.
        :param user_id: Идентификатор пользователя
        :param wallet_address: Адрес кошелька
        """
        try:
            self.client.set(f"user_wallet:{user_id}", wallet_address)
            print(f"Wallet added/updated for user_id {user_id}: {wallet_address}")
        except Exception as e:
            print(f"Error adding/updating wallet for user_id {user_id}: {e}")

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

    def update_wallet_status(self, user_id, status):
        """
        Обновляет статус кошелька для user_id.
        :param user_id: Идентификатор пользователя
        :param status: Новый статус кошелька (например, "PENDING" или "VERIFIED")
        """
        try:
            key = f"user_wallet:{user_id}:status"
            self.client.set(key, status)
            print(f"Updated wallet status for user_id {user_id}: {status}")
        except Exception as e:
            print(f"Error updating wallet status for user_id {user_id}: {e}")

    def get_wallet_status(self, user_id):
        """
        Получает статус кошелька для user_id.
        :param user_id: Идентификатор пользователя
        :return: Статус кошелька или None, если запись не найдена
        """
        try:
            key = f"user_wallet:{user_id}:status"
            status = self.client.get(key)
            if status:
                print(f"Status for user_id {user_id}: {status}")
                return status
            else:
                print(f"No status found for user_id {user_id}")
                return None
        except Exception as e:
            print(f"Error fetching wallet status for user_id {user_id}: {e}")
            return None

# Пример использования
if __name__ == "__main__":
    wallet_data = WalletData()

    # Добавить тестовые данные
    wallet_data.add_wallet("5893785541", "0x12345abcde")
    wallet_data.add_wallet("1234567890", "0x67890fghij")

    # Обновить статус кошелька
    wallet_data.update_wallet_status("5893785541", "PENDING")

    # Получить все кошельки
    wallets = wallet_data.get_all_wallets()

    # Получить кошелёк по user_id
    user_wallet = wallet_data.get_wallet_by_user_id("5893785541")

    # Получить статус кошелька
    wallet_status = wallet_data.get_wallet_status("5893785541")

    # Удалить кошелёк по user_id
    wallet_data.delete_wallet_by_user_id("1")