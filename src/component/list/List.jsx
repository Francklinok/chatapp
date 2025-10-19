import UserInfo from "./userInfo/UserInfo";
import Chatlist from "./chatlist/ChatList";
import "./list.css";

const List = () => {
  return (
    <div className="list">
      <UserInfo className="userinfo" />
      <Chatlist className="chatlist" />
    </div>
  );
};

export default List;
