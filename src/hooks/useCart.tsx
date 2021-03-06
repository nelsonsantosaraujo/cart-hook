import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);
      const stock = await api.get(`stock/${productId}`);
      const currentAmount = productExists ? productExists.amount+1 : 1;

      if(stock.data.amount < currentAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists){
        const mappedProducts = cart.map(product => {
          if(product.id === productId){
            return {
              ...product,
              amount: currentAmount,
            }
          }
          return product;
        });

        setCart(mappedProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(mappedProducts));
      } else {
        const response = await api.get(`products/${productId}`);
        const newProduct = {
          ...response.data,
          amount: 1,
        };
        setCart([...cart, newProduct]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]));
      }
      
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);
      if(productExists){
        const filteredProducts = cart.filter(product => product.id !== productId);
        setCart(filteredProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProducts));
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return;
      }

      const stock = await api.get(`stock/${productId}`);

      if(stock.data.amount < amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productExists = cart.find(product => product.id === productId);
      if(productExists){
        const filteredProducts = cart.map(product => {
          if(product.id === productId){
            return {
              ...product,
              amount
            }
          }

          return product;
        })

        setCart(filteredProducts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredProducts));
      } else {
        throw new Error();
      }
    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
