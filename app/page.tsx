"use client"
import {
  Plus,
  CreditCard,
  Wallet,
  TrendingUp,
  Eye,
  EyeOff,
  Settings,
  Bell,
  QrCode,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Menu,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  CheckCircle,
  Lock,
  User,
  Mail,
  ArrowLeft,
  Camera,
  ChevronRight,
  Palette,
  Globe,
  HelpCircle,
  Trash2,
} from "lucide-react"
import type React from "react"

import { useEffect } from "react"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Card {
  id: string
  type: "crypto" | "credit" | "debit" | "Bitcoin" | "Ethereum"
  name: string
  balance: string
  currency: string
  gradient: string
  lastFour?: string
  network?: string
  details?: string
  address?: string
}

interface Notification {
  id: string
  type: "transaction" | "security" | "system" | "alert"
  title: string
  message: string
  time: string
  read: boolean
  icon: "wallet" | "shield" | "alert" | "check"
}

interface Transaction {
  id: string
  type: "receive" | "send" | "purchase" | "deposit" | "withdrawal" | "cashback" | "stake"
  amount: string
  date: string
  status: string
  merchant?: string
  from?: string
  to?: string
}

const STORAGE_KEYS = {
  USER_CARDS: "ece_wallet_user_cards",
  USER_TRANSACTIONS: "ece_wallet_user_transactions",
  SELECTED_CARD: "ece_wallet_selected_card",
  BALANCES_VISIBLE: "ece_wallet_balances_visible",
  NOTIFICATIONS: "ece_wallet_notifications",
  IS_AUTHENTICATED: "ece_wallet_is_authenticated",
  CURRENT_PAGE: "ece_wallet_current_page",
}

const saveToStorage = (key: string, data: any) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data))
    }
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error)
  }
  return defaultValue
}

const clearStorage = () => {
  try {
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key)
      })
    }
  } catch (error) {
    console.error("Failed to clear localStorage:", error)
  }
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "transaction",
    title: "Bitcoin Received",
    message: "You received 0.00123 BTC from 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    time: "2 minutes ago",
    read: false,
    icon: "wallet",
  },
  {
    id: "2",
    type: "security",
    title: "Security Alert",
    message: "New device login detected from San Francisco, CA",
    time: "1 hour ago",
    read: false,
    icon: "shield",
  },
  {
    id: "3",
    type: "transaction",
    title: "Payment Sent",
    message: "Successfully sent $4.50 to Coffee Shop via Apple Card",
    time: "3 hours ago",
    read: true,
    icon: "check",
  },
  {
    id: "4",
    type: "alert",
    title: "Price Alert",
    message: "Bitcoin has increased by 5% in the last 24 hours",
    time: "6 hours ago",
    read: true,
    icon: "alert",
  },
  {
    id: "5",
    type: "system",
    title: "Wallet Updated",
    message: "Your Ethereum wallet has been successfully updated",
    time: "1 day ago",
    read: true,
    icon: "check",
  },
]

const validateAddress = (address: string, network: string): { isValid: boolean; error?: string } => {
  if (!address || address.trim() === "") {
    return { isValid: false, error: "Address is required" }
  }

  const trimmedAddress = address.trim()

  switch (network.toLowerCase()) {
    case "bitcoin":
    case "btc":
      // Bitcoin address validation (Legacy, SegWit, Bech32)
      const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/
      if (!btcRegex.test(trimmedAddress)) {
        return { isValid: false, error: "Invalid Bitcoin address format" }
      }
      break

    case "ethereum":
    case "eth":
      // Ethereum address validation with checksum
      const ethRegex = /^0x[a-fA-F0-9]{40}$/
      if (!ethRegex.test(trimmedAddress)) {
        return { isValid: false, error: "Invalid Ethereum address format" }
      }
      // Basic checksum validation
      if (trimmedAddress !== trimmedAddress.toLowerCase() && trimmedAddress !== trimmedAddress.toUpperCase()) {
        const hasUpperCase = /[A-F]/.test(trimmedAddress.slice(2))
        const hasLowerCase = /[a-f]/.test(trimmedAddress.slice(2))
        if (hasUpperCase && hasLowerCase) {
          // This would require full EIP-55 checksum validation in a real app
          // For now, we'll accept mixed case as potentially valid
        }
      }
      break

    case "solana":
    case "sol":
      // Solana address validation (Base58, 32-44 characters)
      const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      if (!solRegex.test(trimmedAddress)) {
        return { isValid: false, error: "Invalid Solana address format" }
      }
      break

    default:
      return { isValid: false, error: "Unsupported network" }
  }

  return { isValid: true }
}

const validatePrivateKey = (privateKey: string, network: string): { isValid: boolean; error?: string } => {
  if (!privateKey || privateKey.trim() === "") {
    return { isValid: false, error: "Private key is required" }
  }

  const trimmed = privateKey.trim().replace(/^0x/, "")

  switch (network.toLowerCase()) {
    case "bitcoin":
    case "btc":
      // Bitcoin private key (WIF format or hex)
      const btcWifRegex = /^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/
      const btcHexRegex = /^[0-9a-fA-F]{64}$/
      if (!btcWifRegex.test(privateKey.trim()) && !btcHexRegex.test(trimmed)) {
        return { isValid: false, error: "Invalid Bitcoin private key format" }
      }
      break

    case "ethereum":
    case "eth":
      // Ethereum private key (64 hex characters)
      if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
        return { isValid: false, error: "Invalid Ethereum private key format (must be 64 hex characters)" }
      }
      break

    case "solana":
    case "sol":
      // Solana private key (Base58 or hex)
      const solBase58Regex = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/
      const solHexRegex = /^[0-9a-fA-F]{128}$/
      if (!solBase58Regex.test(privateKey.trim()) && !solHexRegex.test(trimmed)) {
        return { isValid: false, error: "Invalid Solana private key format" }
      }
      break

    default:
      return { isValid: false, error: "Unsupported network for private key validation" }
  }

  return { isValid: true }
}

const validateSeedPhrase = (seedPhrase: string): { isValid: boolean; error?: string } => {
  if (!seedPhrase || seedPhrase.trim() === "") {
    return { isValid: false, error: "Seed phrase is required" }
  }

  const words = seedPhrase.trim().split(/\s+/)

  if (words.length !== 12 && words.length !== 24) {
    return { isValid: false, error: "Seed phrase must be 12 or 24 words" }
  }

  // Check for common invalid patterns
  const hasEmptyWords = words.some((word) => word.length === 0)
  if (hasEmptyWords) {
    return { isValid: false, error: "Seed phrase contains empty words" }
  }

  const hasNumbers = words.some((word) => /\d/.test(word))
  if (hasNumbers) {
    return { isValid: false, error: "Seed phrase should not contain numbers" }
  }

  const hasTooShortWords = words.some((word) => word.length < 3)
  if (hasTooShortWords) {
    return { isValid: false, error: "Seed phrase contains words that are too short" }
  }

  return { isValid: true }
}

const sampleCards: Card[] = [
  {
    id: "sample-btc",
    name: "Bitcoin Wallet",
    type: "Bitcoin",
    balance: "0.00234",
    details: "BTC",
    gradient: "from-orange-400 to-orange-600",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    network: "Bitcoin",
  },
  {
    id: "sample-eth",
    name: "Ethereum Wallet",
    type: "Ethereum",
    balance: "1.2456",
    details: "ETH",
    gradient: "from-blue-400 to-blue-600",
    address: "0x742d35Cc6634C0532925a3b8D4C9db96590c4C87",
    network: "Ethereum",
  },
  {
    id: "sample-card",
    name: "Apple Card",
    type: "Credit",
    balance: "$2,450.00",
    details: "**** 4532",
    gradient: "from-gray-100 to-gray-300",
    address: "",
    network: "Traditional",
  },
]

export default function WalletManager() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadFromStorage(STORAGE_KEYS.IS_AUTHENTICATED, false))
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "forgot">("signin")
  const [showPassword, setShowPassword] = useState(false)

  const [userCards, setUserCards] = useState<Card[]>(() => {
    const stored = loadFromStorage(STORAGE_KEYS.USER_CARDS, [])
    return stored.length > 0 ? stored : sampleCards
  })
  const [userTransactions, setUserTransactions] = useState<{ [key: string]: Transaction[] }>(() =>
    loadFromStorage(STORAGE_KEYS.USER_TRANSACTIONS, {}),
  )
  const [selectedCard, setSelectedCard] = useState<string>(() => loadFromStorage(STORAGE_KEYS.SELECTED_CARD, ""))

  const [balancesVisible, setBalancesVisible] = useState(() => loadFromStorage(STORAGE_KEYS.BALANCES_VISIBLE, true))
  const [menuOpen, setMenuOpen] = useState(false)
  const [cardActionsOpen, setCardActionsOpen] = useState(false)
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [addWalletOpen, setAddWalletOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [cardSettingsOpen, setCardSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    loadFromStorage(STORAGE_KEYS.NOTIFICATIONS, mockNotifications),
  )
  const [currentPage, setCurrentPage] = useState<"home" | "wallets" | "portfolio" | "scanner" | "settings">(() =>
    loadFromStorage(STORAGE_KEYS.CURRENT_PAGE, "home"),
  )

  const [showProfile, setShowProfile] = useState(false)
  const [profileCard, setProfileCard] = useState<Card | null>(null)
  const [selectedCardProfile, setSelectedCardProfile] = useState<Card | null>(null)

  const [walletConnectionStep, setWalletConnectionStep] = useState<"select" | "connect" | "import" | "create">("select")
  const [selectedWalletType, setSelectedWalletType] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string>("")
  const [importMethod, setImportMethod] = useState<"privatekey" | "seedphrase" | "keystore">("seedphrase")
  const [generatedSeedPhrase, setGeneratedSeedPhrase] = useState<string[]>([])
  const [seedPhraseConfirmed, setSeedPhraseConfirmed] = useState(false)

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.IS_AUTHENTICATED, isAuthenticated)
  }, [isAuthenticated])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_CARDS, userCards)
  }, [userCards])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.USER_TRANSACTIONS, userTransactions)
  }, [userTransactions])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SELECTED_CARD, selectedCard)
  }, [selectedCard])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.BALANCES_VISIBLE, balancesVisible)
  }, [balancesVisible])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
  }, [notifications])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CURRENT_PAGE, currentPage)
  }, [currentPage])

  useEffect(() => {
    if (userCards.length > 0 && !selectedCard) {
      setSelectedCard(userCards[0].id)
    }
  }, [userCards, selectedCard])

  // Mock transaction data for profile pages
  const mockTransactions = {
    "1": [
      // Bitcoin Wallet
      {
        id: "1",
        type: "receive",
        amount: "+0.00123 BTC",
        date: "2 hours ago",
        status: "completed",
        from: "External Wallet",
      },
      { id: "2", type: "send", amount: "-0.00089 BTC", date: "1 day ago", status: "completed", to: "Coinbase" },
      {
        id: "3",
        type: "receive",
        amount: "+0.00200 BTC",
        date: "3 days ago",
        status: "completed",
        from: "Mining Pool",
      },
    ],
    "2": [
      // Ethereum Wallet
      {
        id: "1",
        type: "receive",
        amount: "+0.5000 ETH",
        date: "4 hours ago",
        status: "completed",
        from: "DeFi Protocol",
      },
      { id: "2", type: "send", amount: "-0.2544 ETH", date: "2 days ago", status: "completed", to: "Uniswap" },
      {
        id: "3",
        type: "receive",
        amount: "+1.0000 ETH",
        date: "1 week ago",
        status: "completed",
        from: "Staking Rewards",
      },
    ],
    "3": [
      // Apple Card
      {
        id: "1",
        type: "purchase",
        amount: "-$45.99",
        date: "1 hour ago",
        status: "completed",
        merchant: "Apple Store",
      },
      {
        id: "2",
        type: "payment",
        amount: "-$1,200.00",
        date: "3 days ago",
        status: "completed",
        merchant: "Monthly Payment",
      },
      { id: "3", type: "cashback", amount: "+$12.50", date: "1 week ago", status: "completed", merchant: "Daily Cash" },
    ],
    "4": [
      // Chase Debit
      {
        id: "1",
        type: "purchase",
        amount: "-$89.32",
        date: "30 minutes ago",
        status: "completed",
        merchant: "Grocery Store",
      },
      {
        id: "2",
        type: "deposit",
        amount: "+$2,500.00",
        date: "2 days ago",
        status: "completed",
        merchant: "Direct Deposit",
      },
      {
        id: "3",
        type: "withdrawal",
        amount: "-$100.00",
        date: "4 days ago",
        status: "completed",
        merchant: "ATM Withdrawal",
      },
    ],
    "5": [
      // Solana Wallet
      {
        id: "1",
        type: "receive",
        amount: "+25.00 SOL",
        date: "6 hours ago",
        status: "completed",
        from: "Phantom Wallet",
      },
      { id: "2", type: "send", amount: "-15.50 SOL", date: "1 day ago", status: "completed", to: "Solana DEX" },
      { id: "3", type: "stake", amount: "+2.34 SOL", date: "5 days ago", status: "completed", from: "Staking Rewards" },
    ],
  }

  const selectedCardData = userCards.find((card) => card.id === selectedCard)
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleCopyAddress = () => {
    const mockAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    navigator.clipboard.writeText(mockAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getNotificationIcon = (icon: string) => {
    switch (icon) {
      case "wallet":
        return <Wallet className="h-4 w-4" />
      case "shield":
        return <Shield className="h-4 w-4" />
      case "alert":
        return <AlertTriangle className="h-4 w-4" />
      case "check":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "transaction":
        return "text-blue-500 bg-blue-50"
      case "security":
        return "text-red-500 bg-red-50"
      case "alert":
        return "text-orange-500 bg-orange-50"
      case "system":
        return "text-green-500 bg-green-50"
      default:
        return "text-gray-500 bg-gray-50"
    }
  }

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticated(true)
  }

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticated(true)
  }

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setAuthMode("signin")
  }

  const handleCardClick = (card: Card) => {
    setSelectedCard(card.id)
    setProfileCard(card)
    setShowProfile(true)
  }

  const handleMenuNavigation = (page: "home" | "wallets" | "portfolio" | "scanner" | "settings") => {
    setCurrentPage(page)
    setMenuOpen(false)
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    clearStorage()
    // Reset all state to defaults
    setUserCards([])
    setUserTransactions({})
    setSelectedCard("")
    setBalancesVisible(true)
    setNotifications(mockNotifications)
    setCurrentPage("home")
  }

  const recentTransactions = Object.values(userTransactions).flat().slice(0, 3)

  const addWallet = (wallet: Card) => {
    setUserCards((prev) => [...prev, wallet])
    setUserTransactions((prev) => ({ ...prev, [wallet.id]: [] }))
    if (userCards.length === 0) {
      setSelectedCard(wallet.id)
    }
  }

  const removeWallet = (walletId: string) => {
    setUserCards((prev) => prev.filter((card) => card.id !== walletId))
    setUserTransactions((prev) => {
      const newTransactions = { ...prev }
      delete newTransactions[walletId]
      return newTransactions
    })
    if (selectedCard === walletId && userCards.length > 1) {
      const remainingCards = userCards.filter((card) => card.id !== walletId)
      setSelectedCard(remainingCards[0]?.id || "")
    }
  }

  const addTransaction = (walletId: string, transaction: Transaction) => {
    setUserTransactions((prev) => ({
      ...prev,
      [walletId]: [transaction, ...(prev[walletId] || [])],
    }))
  }

  const generateSeedPhrase = () => {
    const words = [
      "abandon",
      "ability",
      "able",
      "about",
      "above",
      "absent",
      "absorb",
      "abstract",
      "absurd",
      "abuse",
      "access",
      "accident",
      "account",
      "accuse",
      "achieve",
      "acid",
      "acoustic",
      "acquire",
      "across",
      "act",
      "action",
      "actor",
      "actress",
      "actual",
      "adapt",
      "add",
      "addict",
      "address",
      "adjust",
      "admit",
      "adult",
      "advance",
      "advice",
      "aerobic",
      "affair",
      "afford",
      "afraid",
      "again",
      "against",
      "age",
      "agent",
      "agree",
      "ahead",
      "aim",
      "air",
      "airport",
      "aisle",
      "alarm",
      "album",
      "alcohol",
      "alert",
      "alien",
      "all",
      "alley",
      "allow",
      "almost",
      "alone",
      "alpha",
      "already",
      "also",
      "alter",
      "always",
      "amateur",
      "amazing",
      "among",
      "amount",
      "amused",
      "analyst",
      "anchor",
      "ancient",
      "anger",
      "angle",
      "angry",
      "animal",
      "ankle",
      "announce",
      "annual",
      "another",
      "answer",
      "antenna",
      "antique",
      "anxiety",
      "any",
      "apart",
      "apology",
      "appear",
      "apple",
      "approve",
      "april",
      "arch",
    ]

    const seedPhrase = []
    for (let i = 0; i < 12; i++) {
      const randomIndex = Math.floor(Math.random() * words.length)
      seedPhrase.push(words[randomIndex])
    }

    setGeneratedSeedPhrase(seedPhrase)
    return seedPhrase
  }

  const createNewWallet = async (walletType: string, walletName: string, seedPhrase?: string[]) => {
    setIsConnecting(true)
    setConnectionError("")

    try {
      // In a real app, you would generate actual wallet addresses from the seed phrase
      const newWallet: Card = {
        id: Date.now().toString(),
        type: "crypto",
        name: walletName || `${walletType} Wallet`,
        balance: "0.00000",
        currency:
          walletType === "Bitcoin"
            ? "BTC"
            : walletType === "Ethereum"
              ? "ETH"
              : walletType === "Solana"
                ? "SOL"
                : walletType === "Cardano"
                  ? "ADA"
                  : "MATIC",
        gradient: "from-gray-50 via-white to-gray-100",
        network: walletType,
      }

      addWallet(newWallet)
      setAddWalletOpen(false)
      setWalletConnectionStep("select")
      setGeneratedSeedPhrase([])
      setSeedPhraseConfirmed(false)
    } catch (error: any) {
      setConnectionError(error.message || "Failed to create wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const connectWallet = async (
    walletType: string,
    connectionMethod: "browser" | "walletconnect" | "import" | "create",
  ) => {
    setIsConnecting(true)
    setConnectionError("")

    try {
      if (connectionMethod === "browser" && walletType === "Ethereum") {
        // Connect to MetaMask or other browser wallet
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts",
          })

          if (accounts.length > 0) {
            const balance = await (window as any).ethereum.request({
              method: "eth_getBalance",
              params: [accounts[0], "latest"],
            })

            const ethBalance = (Number.parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)

            const newWallet: Card = {
              id: Date.now().toString(),
              type: "crypto",
              name: "Ethereum Wallet",
              balance: ethBalance,
              currency: "ETH",
              gradient: "from-gray-100 via-gray-50 to-white",
              network: "Ethereum",
            }

            addWallet(newWallet)
            setAddWalletOpen(false)
            setWalletConnectionStep("select")
          }
        } else {
          throw new Error("No Ethereum wallet found. Please install MetaMask.")
        }
      } else if (connectionMethod === "browser" && walletType === "Solana") {
        // Connect to Phantom or other Solana wallet
        if (typeof window !== "undefined" && (window as any).solana) {
          const response = await (window as any).solana.connect()

          if (response.publicKey) {
            // Mock balance for demo - in real app would fetch from Solana RPC
            const newWallet: Card = {
              id: Date.now().toString(),
              type: "crypto",
              name: "Solana Wallet",
              balance: "45.67",
              currency: "SOL",
              gradient: "from-gray-100 via-white to-gray-50",
              network: "Solana",
            }

            addWallet(newWallet)
            setAddWalletOpen(false)
            setWalletConnectionStep("select")
          }
        } else {
          throw new Error("No Solana wallet found. Please install Phantom.")
        }
      } else if (connectionMethod === "import") {
        // Handle wallet import flow
        setWalletConnectionStep("import")
      } else if (connectionMethod === "create") {
        // Handle wallet creation flow
        setWalletConnectionStep("create")
      } else {
        // Mock connection for other wallet types
        const mockWallet: Card = {
          id: Date.now().toString(),
          type: "crypto",
          name: `${walletType} Wallet`,
          balance: "0.00000",
          currency: walletType === "Bitcoin" ? "BTC" : walletType === "Cardano" ? "ADA" : "MATIC",
          gradient: "from-gray-50 via-white to-gray-100",
          network: walletType,
        }

        addWallet(mockWallet)
        setAddWalletOpen(false)
        setWalletConnectionStep("select")
      }
    } catch (error: any) {
      setConnectionError(error.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const importWallet = async (importData: string, walletType: string, method: string, walletName?: string) => {
    setIsConnecting(true)
    setConnectionError("")

    try {
      let validation: { isValid: boolean; error?: string }

      if (method === "privatekey") {
        validation = validatePrivateKey(importData, walletType)
      } else if (method === "seedphrase") {
        validation = validateSeedPhrase(importData)
      } else if (method === "keystore") {
        // Validate JSON keystore format
        try {
          const keystore = JSON.parse(importData)
          if (!keystore.version || !keystore.crypto) {
            validation = { isValid: false, error: "Invalid keystore format - missing required fields" }
          } else {
            validation = { isValid: true }
          }
        } catch {
          validation = { isValid: false, error: "Invalid JSON format for keystore" }
        }
      } else {
        validation = { isValid: false, error: "Invalid import method" }
      }

      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const newWallet: Card = {
        id: Date.now().toString(),
        type: "crypto",
        name: walletName || `Imported ${walletType} Wallet`,
        balance: "0.00000",
        currency: walletType === "Bitcoin" ? "BTC" : walletType === "Ethereum" ? "ETH" : "SOL",
        gradient: "from-gray-50 via-white to-gray-100",
        network: walletType,
      }

      addWallet(newWallet)
      setAddWalletOpen(false)
      setWalletConnectionStep("select")
      setImportMethod("seedphrase")
    } catch (error: any) {
      setConnectionError(error.message || "Failed to import wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const [sendForm, setSendForm] = useState({
    recipient: "",
    amount: "",
    recipientError: "",
    amountError: "",
  })

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value
    setSendForm((prev) => ({ ...prev, recipient: address }))

    if (address.trim() === "") {
      setSendForm((prev) => ({ ...prev, recipientError: "" }))
      return
    }

    const validation = validateAddress(address, selectedCardData.network || selectedCardData.currency)
    setSendForm((prev) => ({
      ...prev,
      recipientError: validation.isValid ? "" : validation.error || "Invalid address",
    }))
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value
    setSendForm((prev) => ({ ...prev, amount }))

    if (amount.trim() === "") {
      setSendForm((prev) => ({ ...prev, amountError: "" }))
      return
    }

    const numAmount = Number.parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setSendForm((prev) => ({ ...prev, amountError: "Please enter a valid amount" }))
    } else if (numAmount > Number.parseFloat(selectedCardData.balance)) {
      setSendForm((prev) => ({ ...prev, amountError: "Insufficient balance" }))
    } else {
      setSendForm((prev) => ({ ...prev, amountError: "" }))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Auth Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-gray-200">
              <Wallet className="h-8 w-8 text-gray-700" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ECE Wallet</h1>
            <p className="text-gray-600 text-sm">
              {authMode === "signin" && "Welcome back to your secure wallet"}
              {authMode === "signup" && "Create your secure wallet account"}
              {authMode === "forgot" && "Reset your wallet password"}
            </p>
          </div>

          {/* Auth Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-xl" />
            <div className="relative p-8">
              {authMode === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      className="mt-2 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    Sign In to Wallet
                  </Button>
                </form>
              )}

              {authMode === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div>
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      className="mt-2 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signupEmail" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="your@email.com"
                      className="mt-2 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="signupPassword"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      className="mt-2 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    Create Wallet Account
                  </Button>
                </form>
              )}

              {authMode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  <div>
                    <Label htmlFor="resetEmail" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      placeholder="your@email.com"
                      className="mt-2 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg"
                  >
                    Send Reset Link
                  </Button>
                </form>
              )}

              {/* Auth Mode Switcher */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                {authMode === "signin" && (
                  <div className="text-center space-y-3">
                    <button
                      onClick={() => setAuthMode("forgot")}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot your password?
                    </button>
                    <div className="text-sm text-gray-600">
                      Don't have an account?{" "}
                      <button
                        onClick={() => setAuthMode("signup")}
                        className="text-green-600 hover:text-green-700 font-medium transition-colors"
                      >
                        Create one
                      </button>
                    </div>
                  </div>
                )}
                {authMode === "signup" && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        onClick={() => setAuthMode("signin")}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                )}
                {authMode === "forgot" && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      Remember your password?{" "}
                      <button
                        onClick={() => setAuthMode("signin")}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Sign in
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Bank-Level Security</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Your wallet is protected with 256-bit encryption and biometric authentication.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-gray-200" />
        <div className="relative px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-600 hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <h1 className="text-gray-900 text-lg sm:text-xl font-semibold">Wallet</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBalancesVisible(!balancesVisible)}
              className="text-gray-600 hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
            >
              {balancesVisible ? (
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCardActionsOpen(true)}
              className="text-gray-600 hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="text-gray-600 hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10 relative"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {notificationsOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setNotificationsOpen(false)} />
          <div className="absolute right-4 top-16 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-gray-600 hover:bg-gray-100 h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:bg-blue-50 h-7 px-2"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs text-red-600 hover:bg-red-50 h-7 px-2"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}
                        >
                          {getNotificationIcon(notification.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-medium text-gray-900 ${!notification.read ? "font-semibold" : ""}`}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen(false)}
                  className="text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-2">
                <div
                  onClick={() => handleMenuNavigation("wallets")}
                  className="p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <Wallet className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">My Wallets</span>
                </div>
                <div
                  onClick={() => handleMenuNavigation("portfolio")}
                  className="p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Portfolio</span>
                </div>
                <div
                  onClick={() => handleMenuNavigation("scanner")}
                  className="p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <QrCode className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Scan QR Code</span>
                </div>
                <div
                  onClick={() => handleMenuNavigation("settings")}
                  className="p-3 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                >
                  <Settings className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">Settings</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-4">
                  <div
                    onClick={handleSignOut}
                    className="p-3 rounded-xl hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <Lock className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">Sign Out</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {cardActionsOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setCardActionsOpen(false)} />
          <div className="relative w-full sm:w-96 bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Card Actions</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCardActionsOpen(false)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                onClick={() => {
                  setCardActionsOpen(false)
                  setAddCardOpen(true)
                }}
                className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-center"
              >
                <Plus className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Add Card</p>
                <p className="text-xs text-gray-500">Credit or Debit</p>
              </div>
              <div
                onClick={() => {
                  setCardActionsOpen(false)
                  setAddWalletOpen(true)
                }}
                className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-center"
              >
                <Wallet className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Add Wallet</p>
                <p className="text-xs text-gray-500">Crypto Wallet</p>
              </div>
            </div>

            {selectedCardData && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Current Card Actions</h4>
                <div className="space-y-2">
                  <div
                    onClick={() => {
                      setCardActionsOpen(false)
                      setSendOpen(true)
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Send className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">Send</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div
                    onClick={() => {
                      setCardActionsOpen(false)
                      setReceiveOpen(true)
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">Receive</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div
                    onClick={() => {
                      setCardActionsOpen(false)
                      setCardSettingsOpen(true)
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900">Card Settings</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {addCardOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setAddCardOpen(false)} />
          <div className="relative w-full sm:w-96 bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add Card</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAddCardOpen(false)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">
                  Card Number
                </Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry" className="text-sm font-medium text-gray-700">
                    Expiry
                  </Label>
                  <Input id="expiry" placeholder="MM/YY" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">
                    CVV
                  </Label>
                  <Input id="cvv" placeholder="123" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">
                  Cardholder Name
                </Label>
                <Input id="cardName" placeholder="John Doe" className="mt-1" />
              </div>
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">Add Card</Button>
            </div>
          </div>
        </div>
      )}

      {addWalletOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setAddWalletOpen(false)} />
          <div className="relative w-full sm:w-96 bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {walletConnectionStep === "select" && "Add Crypto Wallet"}
                {walletConnectionStep === "connect" && `Connect ${selectedWalletType}`}
                {walletConnectionStep === "import" && `Import ${selectedWalletType} Wallet`}
                {walletConnectionStep === "create" && `Create ${selectedWalletType} Wallet`}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setAddWalletOpen(false)
                  setWalletConnectionStep("select")
                  setConnectionError("")
                  setGeneratedSeedPhrase([])
                  setSeedPhraseConfirmed(false)
                }}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {walletConnectionStep === "select" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: "Bitcoin", icon: "₿", color: "text-orange-600 bg-orange-50" },
                    { name: "Ethereum", icon: "Ξ", color: "text-blue-600 bg-blue-50" },
                    { name: "Solana", icon: "◎", color: "text-purple-600 bg-purple-50" },
                    { name: "Cardano", icon: "₳", color: "text-blue-800 bg-blue-50" },
                    { name: "Polygon", icon: "⬟", color: "text-purple-800 bg-purple-50" },
                  ].map((crypto) => (
                    <div
                      key={crypto.name}
                      onClick={() => {
                        setSelectedWalletType(crypto.name)
                        setWalletConnectionStep("connect")
                      }}
                      className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${crypto.color}`}>
                          <span className="font-bold text-lg">{crypto.icon}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">{crypto.name}</span>
                          <p className="text-xs text-gray-500">Connect, import, or create wallet</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {walletConnectionStep === "connect" && (
              <div className="space-y-4">
                {connectionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm">{connectionError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Browser Wallet Connection */}
                  {(selectedWalletType === "Ethereum" || selectedWalletType === "Solana") && (
                    <div
                      onClick={() => connectWallet(selectedWalletType, "browser")}
                      className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedWalletType === "Ethereum" ? "MetaMask" : "Phantom"}
                          </p>
                          <p className="text-xs text-gray-500">Connect browser wallet</p>
                        </div>
                      </div>
                      {isConnecting ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* WalletConnect */}
                  <div
                    onClick={() => connectWallet(selectedWalletType, "walletconnect")}
                    className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                        <QrCode className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">WalletConnect</p>
                        <p className="text-xs text-gray-500">Scan QR with mobile wallet</p>
                      </div>
                    </div>
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  <div
                    onClick={() => connectWallet(selectedWalletType, "create")}
                    className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Create New Wallet</p>
                        <p className="text-xs text-gray-500">Generate new seed phrase</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Import Wallet */}
                  <div
                    onClick={() => setWalletConnectionStep("import")}
                    className="p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Import Wallet</p>
                        <p className="text-xs text-gray-500">Use private key or seed phrase</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setWalletConnectionStep("select")}
                  className="w-full text-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to wallet selection
                </Button>
              </div>
            )}

            {walletConnectionStep === "import" && (
              <div className="space-y-4">
                {connectionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm">{connectionError}</p>
                  </div>
                )}

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-800 font-medium text-sm">Security Warning</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Never share your private key or seed phrase. Only import wallets you trust.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Import Method Selection */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Import Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMethod("seedphrase")}
                      className={`p-3 rounded-lg text-xs font-medium transition-colors ${
                        importMethod === "seedphrase"
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                      }`}
                    >
                      Seed Phrase
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMethod("privatekey")}
                      className={`p-3 rounded-lg text-xs font-medium transition-colors ${
                        importMethod === "privatekey"
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                      }`}
                    >
                      Private Key
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMethod("keystore")}
                      className={`p-3 rounded-lg text-xs font-medium transition-colors ${
                        importMethod === "keystore"
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200"
                      }`}
                    >
                      Keystore
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.target as HTMLFormElement)
                    const importData = formData.get("importData") as string
                    const walletName = formData.get("walletName") as string
                    importWallet(importData, selectedWalletType, importMethod, walletName)
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="importData" className="text-sm font-medium text-gray-700">
                        {importMethod === "seedphrase" && "Seed Phrase (12 or 24 words)"}
                        {importMethod === "privatekey" && "Private Key"}
                        {importMethod === "keystore" && "Keystore JSON"}
                      </Label>
                      <textarea
                        id="importData"
                        name="importData"
                        rows={importMethod === "keystore" ? 6 : 3}
                        placeholder={
                          importMethod === "seedphrase"
                            ? "word1 word2 word3 ... word12"
                            : importMethod === "privatekey"
                              ? "0x1234567890abcdef..."
                              : '{"version":3,"id":"...","crypto":{...}}'
                        }
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                        required
                      />
                    </div>

                    {importMethod === "keystore" && (
                      <div>
                        <Label htmlFor="keystorePassword" className="text-sm font-medium text-gray-700">
                          Keystore Password
                        </Label>
                        <Input
                          id="keystorePassword"
                          name="keystorePassword"
                          type="password"
                          placeholder="Enter keystore password"
                          className="mt-1"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="walletName" className="text-sm font-medium text-gray-700">
                        Wallet Name (Optional)
                      </Label>
                      <Input
                        id="walletName"
                        name="walletName"
                        placeholder={`My ${selectedWalletType} Wallet`}
                        className="mt-1"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isConnecting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isConnecting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Importing Wallet...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Import Wallet
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <Button
                  variant="ghost"
                  onClick={() => setWalletConnectionStep("connect")}
                  className="w-full text-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to connection options
                </Button>
              </div>
            )}

            {walletConnectionStep === "create" && (
              <div className="space-y-4">
                {connectionError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm">{connectionError}</p>
                  </div>
                )}

                {generatedSeedPhrase.length === 0 ? (
                  <div className="text-center space-y-4">
                    <div className="p-6 bg-blue-50 rounded-xl">
                      <Plus className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-2">Create New {selectedWalletType} Wallet</h4>
                      <p className="text-gray-600 text-sm mb-4">
                        We'll generate a secure 12-word seed phrase for your new wallet. This phrase is the only way to
                        recover your wallet.
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-yellow-800 font-medium text-sm">Important Security Notice</p>
                          <ul className="text-yellow-700 text-xs mt-1 space-y-1">
                            <li>• Write down your seed phrase and store it safely</li>
                            <li>• Never share your seed phrase with anyone</li>
                            <li>• You'll need it to recover your wallet</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <Button onClick={generateSeedPhrase} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Seed Phrase
                    </Button>
                  </div>
                ) : !seedPhraseConfirmed ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                      <h4 className="font-semibold text-green-900 mb-3">Your Seed Phrase</h4>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {generatedSeedPhrase.map((word, index) => (
                          <div key={index} className="bg-white p-2 rounded border text-center">
                            <span className="text-xs text-gray-500">{index + 1}</span>
                            <div className="font-mono text-sm text-gray-900">{word}</div>
                          </div>
                        ))}
                      </div>
                      <p className="text-green-700 text-xs">
                        Write down these words in order and store them safely. You'll need them to recover your wallet.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <input
                        type="checkbox"
                        id="seedPhraseBackup"
                        onChange={(e) => setSeedPhraseConfirmed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <Label htmlFor="seedPhraseBackup" className="text-sm text-gray-700 cursor-pointer">
                        I have safely written down my seed phrase
                      </Label>
                    </div>

                    <Button
                      disabled={!seedPhraseConfirmed}
                      onClick={() => {
                        const walletName = `My ${selectedWalletType} Wallet`
                        createNewWallet(selectedWalletType, walletName, generatedSeedPhrase)
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Create Wallet
                    </Button>
                  </div>
                ) : null}

                <Button
                  variant="ghost"
                  onClick={() => {
                    setWalletConnectionStep("connect")
                    setGeneratedSeedPhrase([])
                    setSeedPhraseConfirmed(false)
                  }}
                  className="w-full text-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to connection options
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {sendOpen && selectedCardData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSendOpen(false)} />
          <div className="relative w-full sm:w-96 bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Send {selectedCardData.currency}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSendOpen(false)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient" className="text-sm font-medium text-gray-700">
                  Recipient Address
                </Label>
                <div className="flex gap-2 mt-1">
                  <div className="flex-1">
                    <Input
                      id="recipient"
                      placeholder="Enter wallet address or scan QR"
                      value={sendForm.recipient}
                      onChange={handleRecipientChange}
                      className={`${sendForm.recipientError ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                    {sendForm.recipientError && <p className="text-red-500 text-xs mt-1">{sendForm.recipientError}</p>}
                  </div>
                  <Button variant="outline" size="icon">
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Amount
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="amount"
                    placeholder="0.00"
                    className={`pr-16 ${sendForm.amountError ? "border-red-500 focus:ring-red-500" : ""}`}
                    value={sendForm.amount}
                    onChange={handleAmountChange}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {selectedCardData.currency}
                  </span>
                </div>
                {sendForm.amountError && <p className="text-red-500 text-xs mt-1">{sendForm.amountError}</p>}
              </div>
              <div>
                <Label htmlFor="note" className="text-sm font-medium text-gray-700">
                  Note (Optional)
                </Label>
                <Input id="note" placeholder="What's this for?" className="mt-1" />
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  !!sendForm.recipientError || !!sendForm.amountError || !sendForm.recipient || !sendForm.amount
                }
              >
                Send {selectedCardData.currency}
              </Button>
            </div>
          </div>
        </div>
      )}

      {receiveOpen && selectedCardData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setReceiveOpen(false)} />
          <div className="relative w-full sm:w-96 bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Receive {selectedCardData.currency}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReceiveOpen(false)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="text-center space-y-4">
              <div className="w-48 h-48 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
                <QrCode className="h-24 w-24 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Your {selectedCardData.currency} Address</p>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-900 truncate">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</span>
                  <Button variant="ghost" size="icon" onClick={handleCopyAddress} className="ml-2 flex-shrink-0">
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Only send {selectedCardData.currency} to this address. Sending other cryptocurrencies may result in
                permanent loss.
              </p>
            </div>
          </div>
        </div>
      )}

      {cardSettingsOpen && selectedCardData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setCardSettingsOpen(false)} />
          <div className="relative w-full sm:w-96 bg-white/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl border border-gray-200 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{selectedCardData.name} Settings</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCardSettingsOpen(false)}
                className="text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Rename Card</span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Transaction History</span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              <div className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Security Settings</span>
                <ArrowUpRight className="h-4 w-4 text-gray-400" />
              </div>
              {selectedCardData.type === "crypto" && (
                <div className="p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Export Private Key</span>
                  <ArrowUpRight className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-4">
                <div className="p-3 rounded-xl hover:bg-red-50 cursor-pointer transition-colors flex items-center justify-between">
                  <span className="text-sm font-medium text-red-600">Remove Card</span>
                  <ArrowUpRight className="h-4 w-4 text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards Carousel */}
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="relative mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 sm:overflow-x-auto sm:pb-4 sm:snap-x sm:snap-mandatory sm:scrollbar-hide">
            {/* Updated all card mappings to use userCards */}
            {userCards.map((card, index) => (
              <div
                key={card.id}
                className={`flex-shrink-0 w-full sm:w-80 lg:w-96 xl:w-80 h-44 sm:h-48 md:h-52 lg:h-48 sm:snap-center transition-all duration-300 ease-out cursor-pointer ${
                  selectedCard === card.id
                    ? "transform scale-100 sm:scale-105 hover:scale-105 sm:hover:scale-110 hover:-translate-y-2"
                    : "transform scale-100 sm:scale-95 opacity-100 sm:opacity-70 hover:scale-105 sm:hover:scale-100 hover:-translate-y-1 sm:hover:opacity-90"
                }`}
                onClick={() => handleCardClick(card)}
              >
                <div
                  className={`relative w-full h-full rounded-2xl sm:rounded-3xl bg-gradient-to-br ${card.gradient} shadow-xl hover:shadow-2xl overflow-hidden border border-gray-200 transition-all duration-300`}
                >
                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />

                  {/* Card content */}
                  <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between text-gray-900">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-700 font-medium">
                          {balancesVisible ? card.name : "••••••••••"}
                        </p>
                        {card.network && (
                          <p className="text-xs text-gray-500 mt-1">{balancesVisible ? card.network : "••••••"}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {card.type === "crypto" ? (
                          <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                        ) : (
                          <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">
                        {balancesVisible ? card.balance : "••••••••"}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {balancesVisible ? card.currency : "••••••"}
                        {card.lastFour && balancesVisible && ` •••• ${card.lastFour}`}
                        {card.lastFour && !balancesVisible && " •••• ••••"}
                      </p>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200/30 backdrop-blur-sm" />
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300/40 backdrop-blur-sm" />
                </div>
              </div>
            ))}
          </div>

          {/* Card indicators - hidden on mobile since cards are stacked */}
          <div className="hidden sm:flex justify-center gap-2 mt-4">
            {/* Updated card carousel to use userCards */}
            {userCards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card.id)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  selectedCard === card.id ? "bg-gray-900 w-4 sm:w-6" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative rounded-xl sm:rounded-2xl bg-white backdrop-blur-xl border border-gray-200 p-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
            <div className="relative">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mb-2" />
              <p className="text-gray-900 font-medium text-sm sm:text-base">Portfolio</p>
              <p className="text-gray-500 text-xs sm:text-sm">View performance</p>
            </div>
          </div>

          <div className="relative rounded-xl sm:rounded-2xl bg-white backdrop-blur-xl border border-gray-200 p-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
            <div className="relative">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-2" />
              <p className="text-gray-900 font-medium text-sm sm:text-base">Add Funds</p>
              <p className="text-gray-500 text-xs sm:text-sm">Buy crypto or add card</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="relative rounded-xl sm:rounded-2xl bg-white backdrop-blur-xl border border-gray-200 p-4 sm:p-6 overflow-hidden shadow-sm">
          <div className="relative">
            <h3 className="text-gray-900 font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Recent Activity</h3>
            <div className="space-y-2 sm:space-y-3">
              {[
                { name: "Bitcoin Purchase", amount: "+0.00123 BTC", time: "2 hours ago", type: "crypto" },
                { name: "Coffee Shop", amount: "-$4.50", time: "5 hours ago", type: "payment" },
                { name: "Ethereum Swap", amount: "+0.45 ETH", time: "1 day ago", type: "crypto" },
              ].map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 sm:py-3 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "crypto"
                          ? "bg-gray-100 border border-gray-200"
                          : "bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {transaction.type === "crypto" ? (
                        <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                      ) : (
                        <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-gray-900 text-xs sm:text-sm font-medium">{transaction.name}</p>
                      <p className="text-gray-500 text-xs">{transaction.time}</p>
                    </div>
                  </div>
                  <p
                    className={`text-xs sm:text-sm font-medium ${
                      transaction.amount.startsWith("+") ? "text-green-500" : "text-gray-900"
                    }`}
                  >
                    {balancesVisible ? transaction.amount : "••••"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showProfile && profileCard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-white/20">
            {/* Profile Header */}
            <div className="relative p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Card Details</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="p-2 hover:bg-gray-100/50 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Card Preview */}
              <div
                className={`relative w-full h-32 rounded-2xl bg-gradient-to-br ${profileCard.gradient} shadow-lg overflow-hidden border border-gray-200 mb-6`}
              >
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
                <div className="relative h-full p-4 flex flex-col justify-between text-gray-900">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-700 font-medium">{profileCard.name}</p>
                      {profileCard.network && <p className="text-xs text-gray-500 mt-1">{profileCard.network}</p>}
                    </div>
                    {profileCard.type === "crypto" ? (
                      <Wallet className="h-5 w-5 text-gray-700" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-gray-700" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{profileCard.balance}</p>
                    <p className="text-xs text-gray-600">
                      {profileCard.currency}
                      {profileCard.lastFour && ` •••• ${profileCard.lastFour}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="px-6 pb-6 max-h-96 overflow-y-auto">
              {/* Wallet Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                  <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                  <p className="text-lg font-bold text-gray-900">{profileCard.balance}</p>
                </div>
                <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                  <p className="text-xs text-gray-500 mb-1">
                    {profileCard.type === "crypto" ? "Network" : "Card Type"}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {profileCard.network || (profileCard.type === "credit" ? "Credit" : "Debit")}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button className="flex flex-col items-center p-3 bg-blue-50/50 hover:bg-blue-100/50 rounded-xl transition-colors border border-blue-200/50">
                    <Send className="h-5 w-5 text-blue-600 mb-1" />
                    <span className="text-xs text-blue-700 font-medium">Send</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-green-50/50 hover:bg-green-100/50 rounded-xl transition-colors border border-green-200/50">
                    <ArrowDownLeft className="h-5 w-5 text-green-600 mb-1" />
                    <span className="text-xs text-green-700 font-medium">Receive</span>
                  </button>
                  <button className="flex flex-col items-center p-3 bg-gray-50/50 hover:bg-gray-100/50 rounded-xl transition-colors border border-gray-200/50">
                    <Settings className="h-5 w-5 text-gray-600 mb-1" />
                    <span className="text-xs text-gray-700 font-medium">Settings</span>
                  </button>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Transactions</h3>
                <div className="space-y-3">
                  {/* Updated profile transactions to use userTransactions */}
                  {(userTransactions[profileCard.id as keyof typeof userTransactions] || []).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50/30 backdrop-blur-sm rounded-xl border border-gray-200/30"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.type === "receive" ||
                            transaction.type === "deposit" ||
                            transaction.type === "cashback" ||
                            transaction.type === "stake"
                              ? "bg-green-100 text-green-600"
                              : transaction.type === "send" ||
                                  transaction.type === "purchase" ||
                                  transaction.type === "withdrawal"
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {transaction.type === "receive" ||
                          transaction.type === "deposit" ||
                          transaction.type === "cashback" ||
                          transaction.type === "stake" ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : transaction.type === "send" ||
                            transaction.type === "purchase" ||
                            transaction.type === "withdrawal" ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.merchant || transaction.from || transaction.to || "Transaction"}
                          </p>
                          <p className="text-xs text-gray-500">{transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            transaction.amount.startsWith("+") ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {transaction.amount}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === "home" && (
        <>
          {/* Main wallet interface */}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            {/* Cards carousel */}
            <div className="relative mb-6 sm:mb-8">
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide md:grid md:grid-cols-3 md:gap-6 md:overflow-visible">
                {/* Updated wallet manager to use userCards */}
                {userCards.map((card, index) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardProfile(card)}
                    className={`relative flex-shrink-0 w-80 sm:w-full h-48 sm:h-52 rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      index === 0
                        ? "bg-gradient-to-br from-gray-100 to-gray-200"
                        : index === 1
                          ? "bg-gradient-to-br from-gray-50 to-gray-150"
                          : "bg-gradient-to-br from-white to-gray-100"
                    } backdrop-blur-xl border border-gray-200/50`}
                  >
                    {balancesVisible ? (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-gray-900 font-semibold text-base sm:text-lg">{card.name}</h3>
                            <p className="text-gray-600 text-sm">{card.type}</p>
                          </div>
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            {card.type === "Bitcoin" && <span className="text-orange-600 font-bold text-sm">₿</span>}
                            {card.type === "Ethereum" && <span className="text-blue-600 font-bold text-sm">Ξ</span>}
                            {card.type === "Credit" && <span className="text-gray-600 font-bold text-sm">💳</span>}
                          </div>
                        </div>
                        <div className="mt-auto">
                          <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{card.balance}</div>
                          <div className="text-gray-600 text-sm">{card.details}</div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gray-200/80 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <div className="text-center">
                          <EyeOff className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-600 font-medium">Card Hidden</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Card indicators */}
              <div className="flex justify-center gap-2 mt-4 md:hidden">
                {/* Updated card indicators to use userCards */}
                {userCards.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${index === 0 ? "bg-gray-900" : "bg-gray-300"}`}
                  />
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 hover:bg-white/90 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Portfolio</h3>
                    <p className="text-gray-600 text-sm">View performance</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50 hover:bg-white/90 transition-colors cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Add Funds</h3>
                    <p className="text-gray-600 text-sm">Buy crypto or add card</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-gray-200/50">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-between ${
                          transaction.type === "receive" ||
                          transaction.type === "deposit" ||
                          transaction.type === "cashback" ||
                          transaction.type === "stake"
                            ? "bg-green-100"
                            : transaction.type === "send" ||
                                transaction.type === "purchase" ||
                                transaction.type === "withdrawal"
                              ? "bg-red-100"
                              : "bg-blue-100"
                        }`}
                      >
                        {(transaction.type === "receive" ||
                          transaction.type === "deposit" ||
                          transaction.type === "cashback" ||
                          transaction.type === "stake") && <ArrowDownLeft className="h-5 w-5 text-green-600" />}
                        {(transaction.type === "send" ||
                          transaction.type === "purchase" ||
                          transaction.type === "withdrawal") && <ArrowUpRight className="h-5 w-5 text-red-600" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.type === "receive" && `From ${transaction.from}`}
                          {transaction.type === "send" && `To ${transaction.to}`}
                          {transaction.type === "purchase" && transaction.merchant}
                          {transaction.type === "deposit" && transaction.merchant}
                          {transaction.type === "withdrawal" && transaction.merchant}
                          {transaction.type === "cashback" && transaction.merchant}
                          {transaction.type === "stake" && transaction.from}
                        </p>
                        <p className="text-sm text-gray-500">{transaction.date}</p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold ${
                        transaction.type === "receive" ||
                        transaction.type === "deposit" ||
                        transaction.type === "cashback" ||
                        transaction.type === "stake"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {currentPage === "wallets" && (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMenuNavigation("home")}
              className="text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">My Wallets</h2>
          </div>

          <div className="grid gap-4 mb-6">
            {/* Updated portfolio view to use userCards */}
            {userCards.map((card) => (
              <div
                key={card.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 hover:bg-white/90 transition-colors cursor-pointer"
                onClick={() => setSelectedCardProfile(card)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {card.type === "Bitcoin" && <span className="text-orange-600 font-bold">₿</span>}
                      {card.type === "Ethereum" && <span className="text-blue-600 font-bold">Ξ</span>}
                      {card.type === "Credit" && <span className="text-gray-600 font-bold">💳</span>}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{card.name}</h3>
                      <p className="text-gray-600 text-sm">{card.type}</p>
                      <p className="text-gray-500 text-xs">{card.details}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{card.balance}</div>
                    <div className="text-green-600 text-sm">+2.5% today</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setCardActionsOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Wallet
          </Button>
        </div>
      )}

      {currentPage === "portfolio" && (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMenuNavigation("home")}
              className="text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
          </div>

          {/* Portfolio Summary */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 mb-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">$12,847.23</div>
              <div className="text-green-600 font-medium">+$247.89 (+1.97%) today</div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gray-600 text-sm">24h Change</div>
                <div className="text-green-600 font-semibold">+1.97%</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">7d Change</div>
                <div className="text-green-600 font-semibold">+12.4%</div>
              </div>
              <div>
                <div className="text-gray-600 text-sm">30d Change</div>
                <div className="text-red-600 font-semibold">-3.2%</div>
              </div>
            </div>
          </div>

          {/* Asset Breakdown */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Asset Allocation</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-xs">₿</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Bitcoin</div>
                    <div className="text-gray-600 text-sm">0.00234 BTC</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">$1,247.89</div>
                  <div className="text-green-600 text-sm">+2.1%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">Ξ</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Ethereum</div>
                    <div className="text-gray-600 text-sm">1.2456 ETH</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">$3,149.34</div>
                  <div className="text-green-600 text-sm">+1.8%</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-xs">💳</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Apple Card</div>
                    <div className="text-gray-600 text-sm">Available Balance</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">$2,450.00</div>
                  <div className="text-gray-600 text-sm">--</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50">
            <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="h-48 bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentPage === "scanner" && (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMenuNavigation("home")}
              className="text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Scan QR Code</h2>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 mb-6">
            <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
              <div className="text-center text-gray-500">
                <QrCode className="h-16 w-16 mx-auto mb-4" />
                <p className="font-medium">Camera view would appear here</p>
                <p className="text-sm">Point your camera at a QR code</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600 mb-4">Scan QR codes to:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <ArrowUpRight className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-blue-900 font-medium text-sm">Send Crypto</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <ArrowDownLeft className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-green-900 font-medium text-sm">Receive Funds</p>
                </div>
              </div>
            </div>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium">
            <Camera className="h-5 w-5 mr-2" />
            Enable Camera
          </Button>
        </div>
      )}

      {currentPage === "settings" && (
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMenuNavigation("home")}
              className="text-gray-600 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          </div>

          <div className="space-y-4">
            {/* Account Settings */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50">
              <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Profile</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Security</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Notifications</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50">
              <h3 className="font-semibold text-gray-900 mb-4">Privacy</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Show Balances</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBalancesVisible(!balancesVisible)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      balancesVisible ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${
                        balancesVisible ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </Button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Biometric Lock</span>
                  </div>
                  <Button variant="ghost" size="sm" className="w-12 h-6 rounded-full bg-blue-600">
                    <div className="w-4 h-4 bg-white rounded-full translate-x-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50">
              <h3 className="font-semibold text-gray-900 mb-4">App</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Theme</span>
                  </div>
                  <span className="text-gray-600 text-sm">Light</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Language</span>
                  </div>
                  <span className="text-gray-600 text-sm">English</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-gray-600" />
                    <span className="text-gray-900">Help & Support</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50">
              <h3 className="font-semibold text-red-900 mb-4">Danger Zone</h3>
              <div className="space-y-3">
                <div
                  onClick={handleSignOut}
                  className="flex items-center justify-between py-2 cursor-pointer hover:bg-red-100/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    <span className="text-red-900">Clear All Data & Sign Out</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
