-- Function: after_ride_accepted()
CREATE OR REPLACE FUNCTION after_ride_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.Status = 'accepted' AND OLD.Status <> 'accepted' THEN
    DELETE FROM Ride_Request WHERE Ride_ID = NEW.Ride_ID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: on update of Ride.Status
DROP TRIGGER IF EXISTS trg_after_ride_accepted ON Ride;

CREATE TRIGGER trg_after_ride_accepted
AFTER UPDATE ON Ride
FOR EACH ROW
EXECUTE FUNCTION after_ride_accepted();
