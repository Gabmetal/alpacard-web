package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleConsumer Role = "CONSUMER"
	RoleStaff    Role = "STAFF"
	RoleOwner    Role = "OWNER"
	RoleAdmin    Role = "ADMIN"
)

type TransactionType string

const (
	TxEarn   TransactionType = "EARN"
	TxRedeem TransactionType = "REDEEM"
)

// Base model using UUID primary keys
type BaseModel struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *BaseModel) BeforeCreate(tx *gorm.DB) (err error) {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return
}

type User struct {
	BaseModel
	Email                 string     `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash          string     `gorm:"not null" json:"-"`
	Name                  string     `json:"name"`
	Role                  Role       `gorm:"type:varchar(20);default:'CONSUMER'" json:"role"`
	IsAnonymous           bool       `gorm:"default:false" json:"isAnonymous"`
	EmailVerified         bool       `gorm:"default:false" json:"emailVerified"`
	VerificationToken     string     `gorm:"type:varchar(100);index" json:"-"`
	VerificationExpiresAt *time.Time `json:"-"`
	
	// Relations
	OwnedBusinesses []Business `gorm:"foreignKey:OwnerID" json:"ownedBusinesses,omitempty"`
	StaffAt         []Business `gorm:"many2many:business_staff;" json:"staffAt,omitempty"`
	Cards           []Card     `gorm:"foreignKey:UserID" json:"cards,omitempty"`
}

type Business struct {
	BaseModel
	Name        string     `gorm:"not null" json:"name"`
	Slug        string     `gorm:"uniqueIndex;not null" json:"slug"`
	LogoURL     string     `json:"logoUrl"`
	BrandColor  string     `gorm:"type:varchar(50);default:'#4f46e5'" json:"brandColor"`
	Description string     `json:"description"`
	Category    string     `gorm:"type:varchar(100)" json:"category"`
	Website     string     `json:"website"`
	Instagram   string     `json:"instagram"`
	MenuType    string     `gorm:"type:varchar(20);default:'link'" json:"menuType"`
	MenuURL     string     `gorm:"type:text" json:"menuUrl"`
	MenuItems   string     `gorm:"type:text" json:"menuItems"`
	OwnerID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"ownerId"`
	Owner       *User      `gorm:"foreignKey:OwnerID" json:"owner,omitempty"`
	Staff       []User     `gorm:"many2many:business_staff;" json:"staff,omitempty"`
	Campaigns   []Campaign `gorm:"foreignKey:BusinessID" json:"campaigns,omitempty"`
}

type Campaign struct {
	BaseModel
	BusinessID     uuid.UUID `gorm:"type:uuid;not null;index" json:"businessId"`
	Business       *Business `gorm:"foreignKey:BusinessID" json:"business,omitempty"`
	Name           string    `gorm:"not null" json:"name"`
	Description    string    `json:"description"`
	StampsRequired int       `gorm:"default:10" json:"stampsRequired"`
	Reward         string    `json:"reward"`
	LogoURL        string    `json:"logoUrl"`
	BgType         string    `gorm:"type:varchar(20);default:'preset'" json:"bgType"`
	BgValue        string    `gorm:"type:varchar(255);default:'espresso'" json:"bgValue"`
	BgImageURL     string    `json:"bgImageUrl"`
	TextColor      string    `gorm:"type:varchar(50);default:'#ffffff'" json:"textColor"`
	StampIcon      string    `gorm:"type:varchar(50);default:'coffee'" json:"stampIcon"`
	IsActive       bool      `gorm:"default:true" json:"isActive"`
	CardsCount     int64     `gorm:"-" json:"cardsCount,omitempty"`
	TotalStamps    int64     `gorm:"-" json:"totalStamps,omitempty"`
}

type Card struct {
	BaseModel
	CampaignID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_campaign" json:"campaignId"`
	Campaign   *Campaign `gorm:"foreignKey:CampaignID" json:"campaign,omitempty"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_campaign" json:"userId"`
	User       *User     `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Stamps     int       `gorm:"default:0" json:"stamps"`
}

type Transaction struct {
	BaseModel
	Type        TransactionType `gorm:"type:varchar(20);not null" json:"type"`
	Amount      int             `json:"amount"`
	CardID      uuid.UUID       `gorm:"type:uuid;not null;index" json:"cardId"`
	Card        *Card           `gorm:"foreignKey:CardID" json:"card,omitempty"`
	CustomerID  uuid.UUID       `gorm:"type:uuid;index" json:"customerId"`
	Customer    *User           `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	ClientName  string          `gorm:"type:varchar(255)" json:"clientName"`
	ClientEmail string          `gorm:"type:varchar(255)" json:"clientEmail"`
	StaffID     uuid.UUID       `gorm:"type:uuid;not null" json:"staffId"`
	Staff       *User           `gorm:"foreignKey:StaffID" json:"staff,omitempty"`
	BusinessID  uuid.UUID       `gorm:"type:uuid;not null;index" json:"businessId"`
	TokenJTI    string          `gorm:"type:varchar(255);uniqueIndex" json:"tokenJti"`
}

// ScannedToken prevents replay attacks within the QR token expiration window
type ScannedToken struct {
	JTI       string    `gorm:"primaryKey;type:varchar(255)" json:"jti"`
	CardID    uuid.UUID `gorm:"type:uuid;not null" json:"cardId"`
	ScannedBy uuid.UUID `gorm:"type:uuid;not null" json:"scannedBy"`
	CreatedAt time.Time `json:"createdAt"`
}
