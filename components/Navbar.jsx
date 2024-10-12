import { Wallet } from 'lucide-react'
import React from 'react'

const Navbar = () => {
  return (
    <>
    <div className='w-full h-[50px] bg-black text-white flex justify-start items-center align-middle'>
    <Wallet className='mx-4'/><p className='font-bold'>My Wallet</p>
    </div>
    </>
  )
}

export default Navbar