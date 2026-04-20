-- Trigger to enforce minimum player weight
DELIMITER $$
CREATE TRIGGER validate_player_weight
BEFORE INSERT ON players
FOR EACH ROW
BEGIN
    IF NEW.Weight_in_kg < 60 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Player is underweight. Minimum required weight is 60 kg.';
    END IF;
END$$
DELIMITER ;

