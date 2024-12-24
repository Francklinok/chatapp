import UserInfo from "./userInfo/UserInfo";
import Chatlist from "./chatlist/ChatList";
import "./list.css";

// Define the List component
const List = () => {
  return (
    // Wrapper div with the class name "list" to apply styles
    <div className="list">
      <UserInfo className="userinfo" />
      <Chatlist className="chatlist" />
    </div>
  );
};

export default List;
