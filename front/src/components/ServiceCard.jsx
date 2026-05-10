import React from 'react';
import styles from './ServiceCard.module.scss';

const ServiceCard = ({ title, desc, img, color, price, icon, onBook }) => {
  return (
    <div 
      className={styles.card} 
      style={{ '--dynamic-color': color }}
    >
      <div className={styles.imageContainer}>
        <img src={img} alt={title} loading="lazy" />
        <div className={styles.iconWrapper} style={{ color: color }}>
          {icon}
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.desc}>{desc}</p>
        <div className={styles.footer}>
          <span className={styles.price}>{price}</span>
          <button 
            className={styles.btnBook} 
            onClick={() => onBook({ title, desc, price, color })}
            style={{ borderColor: color, color: color }}
          >
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;